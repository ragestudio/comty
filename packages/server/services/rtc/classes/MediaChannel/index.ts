import * as mediasoup from "mediasoup"
import EventEmitter from "@foxify/events"

import consumeHandler from "./handlers/consume"
import produceHandler from "./handlers/produce"
import stopProduceHandler from "./handlers/stopProduce"

import joinClientHandler from "./handlers/joinClient"
import leaveClientHandler from "./handlers/leaveClient"

import connectTransportHandler from "./handlers/connectTransport"
import createTransportHandler from "./handlers/createTransport"

import type { MediaChannelParams, RTCClient } from "./types"

export default class MediaChannel {
	params: MediaChannelParams
	data: any
	channelId: string
	worker: mediasoup.types.Worker
	mediaCodecs: any[]
	started_at: Date
	closed: Boolean = false
	events: EventEmitter = new EventEmitter()

	static defaultMediaCodecs = [
		{
			kind: "audio",
			mimeType: "audio/opus",
			clockRate: 48000,
			channels: 2,
			parameters: {
				useinbandfec: 1,
				usedtx: 1,
				minptime: 10,
				maxplaybackrate: 48000,
			},
			headerExtensions: [
				{
					uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
					kind: "audio",
				},
			],
		},
		{
			kind: "video",
			mimeType: "video/vp9",
			clockRate: 90000,
			parameters: {
				"profile-id": 2,
				"x-google-start-bitrate": 1000,
			},
		},
		{
			kind: "video",
			mimeType: "video/h264",
			clockRate: 90000,
			parameters: {
				"packetization-mode": 1,
				"profile-level-id": "4d0032",
				"level-asymmetry-allowed": 1,
				"x-google-start-bitrate": 1000,
			},
		},
	]

	router: mediasoup.types.Router = null
	clients: Set<RTCClient> = new Set()
	producers: Map<string, Map<string, any>> = new Map()
	consumers: Map<string, any[]> = new Map()
	webrtcServer: mediasoup.types.WebRtcServer<mediasoup.types.AppData>

	constructor(params: MediaChannelParams) {
		this.params = params
		this.data = params.data
		this.channelId = params.channelId
		this.worker = params.worker
		this.webrtcServer = params.webrtcServer
		this.mediaCodecs = params.mediaCodecs || MediaChannel.defaultMediaCodecs
		this.started_at = new Date()
	}

	async initialize() {
		try {
			console.log(`[CHANNEL:${this.channelId}] Initializing`, this.data)

			this.router = await this.worker.createRouter({
				mediaCodecs: this.mediaCodecs,
			})

			this.router.on("workerclose", () => {
				console.log(
					`[CHANNEL:${this.channelId}] Router worker closed for channel ${this.channelId}`,
				)
			})

			this.events.emit("started", this)

			// try {
			// 	this.sendToGroupTopic("vc:started", {
			// 		...this.data,
			// 		channelId: this.channelId,
			// 		started_at: this.started_at,
			// 	})
			// } catch (err) {
			// 	console.error(err)
			// }
		} catch (error) {
			console.error(
				`[CHANNEL:${this.channelId}] Error initializing `,
				error,
			)
			throw error
		}
	}

	joinClient = joinClientHandler.bind(this)
	leaveClient = leaveClientHandler.bind(this)

	createTransport = createTransportHandler.bind(this)
	connectTransport = connectTransportHandler.bind(this)

	produce = produceHandler.bind(this)
	stopProduce = stopProduceHandler.bind(this)
	consume = consumeHandler.bind(this)

	async close() {
		if (this.closed) {
			return null
		}

		this.closed = true

		try {
			// Close all consumers
			for (const [, consumers] of this.consumers) {
				if (Array.isArray(consumers)) {
					for (const consumer of consumers) {
						if (consumer && !consumer.closed) {
							consumer.close()
						}
					}
				}
			}

			this.consumers.clear()

			// Close all producers
			for (const [userId, userProducers] of this.producers) {
				for (const [id, producerInst] of userProducers) {
					if (
						producerInst &&
						producerInst.producer &&
						!producerInst.producer.closed
					) {
						producerInst.producer.close()
						// Ensure cleanup is called
						await producerInst.onProducerClose()
					}
				}
			}

			this.producers.clear()

			// Close router
			if (this.router && !this.router.closed) {
				this.router.close()
			}

			// Clear clients
			this.clients.clear()

			console.info(`[CHANNEL:${this.channelId}] closed`)

			this.events.emit("closed", this)

			// try {
			// 	this.sendToGroupTopic("vc:ended", {
			// 		channelId: this.channelId,
			// 	})
			// } catch (err) {
			// 	console.error(err)
			// }

			if (this.params.controller) {
				try {
					this.params.controller.instances.delete(this.channelId)
					console.log(
						`[CHANNEL:${this.channelId}] self deleted from instances pool`,
					)
				} catch (err) {
					console.error(
						`[CHANNEL:${this.channelId}] Failed to self delete from controller`,
					)
				}
			}
		} catch (error) {
			console.error(`[CHANNEL:${this.channelId}] Error closing`, error)
		}
	}

	async handleClientEvent(client: RTCClient, payload: any) {
		if (!payload.event || !payload.data) {
			throw new Error("Missing required parameters")
		}

		switch (payload.event) {
			case "updateVoiceState": {
				this.updateClientVoiceState(client, payload.data)
				break
			}

			default: {
				throw new Error("Invalid event")
			}
		}

		// broadcast to other clients
		this.sendToClients(client, `media:channel:client_event`, {
			userId: client.userId,
			event: payload.event,
			data: payload.data,
			clientVoiceState: client.voiceState,
		})

		this.events.emit("client:event", this, client, payload)
		// this.sendToGroupTopic("client:vc:event", {
		// 	event: payload.event,
		// 	userId: client.userId,
		// 	channelId: this.channelId,
		// 	user: {
		// 		_id: client.context.user._id,
		// 		username: client.context.user.username,
		// 		avatar: client.context.user.avatar,
		// 	},
		// 	data: payload.data,
		// })
	}

	async handleSoundpadDispatch(client: RTCClient, payload: any) {
		this.broadcastToClients(`media:channel:soundpad:dispatch`, {
			userId: client.userId,
			data: payload,
		})
	}

	updateClientVoiceState(client: RTCClient, update: any) {
		for (const c of this.clients) {
			if (c.userId === client.userId) {
				c.voiceState = {
					...c.voiceState,
					...update,
				}
			}
		}
	}

	_setupTransportEvents(transport: any, client: RTCClient) {
		transport.on("dtlsstatechange", (dtlsState: string) => {
			console.log(
				`[CHANNEL:${this.channelId}] Transport ${transport.id} DTLS state: ${dtlsState}`,
			)
		})

		transport.on("iceconnectionstatechange", (iceState: string) => {
			console.log(
				`[CHANNEL:${this.channelId}] Transport ${transport.id} ICE state: ${iceState}`,
			)
		})

		transport.on("@close", () => {
			if (client.transports) {
				client.transports.delete(transport.id)
			}
		})
	}

	_setupConsumerEvents(consumer: any, client: RTCClient) {
		consumer.on("transportclose", () => {
			console.log(`[CHANNEL:${this.channelId}] consumer transport closed`)
		})

		consumer.on("producerclose", () => {
			console.log(`[CHANNEL:${this.channelId}] consumer producer closed`)
		})
	}

	getConnectedClientsUserIds() {
		return Array.from(this.clients).map((c) => c.userId)
	}

	getConnectedClientsSerialized() {
		return Array.from(this.clients).map((c) => {
			return {
				userId: c.userId,
				user_id: c.userId,
				voiceState: c.voiceState,
				voice_state: c.voiceState,
				user: {
					_id: c.context.user?._id,
					username: c.context.user?.username,
					avatar: c.context.user?.avatar,
				},
			}
		})
	}

	getProducersSerialized() {
		const producers = new Set()

		for (const [producerUserId, userProducers] of this.producers) {
			for (const [producerId, producer] of userProducers) {
				producers.add({
					id: producerId,
					producer_id: producerId,
					user_id: producerUserId,
					kind: producer.producer.kind,
					appData: producer.producer.appData,
				})
			}
		}

		return Array.from(producers)
	}

	/**
	 * Send a event to all clients except the one provided
	 * @param {Object<RTCClient>} client Origin client client
	 * @param {string} event The event name
	 * @param {Object} payload The payload object to send
	 */
	async sendToClients(client: RTCClient, event: string, payload: any) {
		try {
			const otherClients = Array.from(this.clients).filter(
				(c) => c.userId !== client.userId,
			)

			for (const otherClient of otherClients) {
				await otherClient.emit(event, payload)
			}
		} catch (error) {
			console.error(
				`[CHANNEL:${this.channelId}] Error broadcasting to clients for [${client.userId}]:`,
				error,
			)
		}
	}

	/**
	 * Broadcast an event to all clients
	 * @param {string} event
	 * @param {Object} payload
	 */
	async broadcastToClients(event: string, payload: any) {
		try {
			for (const client of this.clients) {
				await client.emit(event, payload)
			}
		} catch (error) {
			console.error(
				`[CHANNEL:${this.channelId}] Error broadcasting to clients`,
				error,
			)
		}
	}

	/**
	 * Send an event to the group topic
	 * @param {String} event
	 * @param {Object} payload
	 * @return {Promise}
	 */
	// async sendToGroupTopic(event: string, payload: any): Promise<any> {
	// 	const topic = `group:${this.data.group_id}`

	// 	try {
	// 		return await (globalThis as any).websockets.senders.toTopic(
	// 			topic,
	// 			`${topic}:${event}`,
	// 			payload,
	// 		)
	// 	} catch (error) {
	// 		console.error(
	// 			`[CHANNEL:${this.channelId}] Error sending to group topic`,
	// 			error,
	// 		)
	// 	}
	// }
}
