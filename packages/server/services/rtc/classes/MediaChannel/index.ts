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
	worker: any
	mediaCodecs: any[]

	static defaultMediaCodecs = [
		{
			kind: "audio",
			mimeType: "audio/opus",
			clockRate: 48000,
			channels: 2,
			parameters: {
				useinbandfec: 1,
				usedtx: 1,
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

	router: any = null
	clients: Set<RTCClient> = new Set()
	producers: Map<string, Map<string, any>> = new Map()
	consumers: Map<string, any[]> = new Map()

	constructor(params: MediaChannelParams) {
		this.params = params
		this.data = params.data
		this.channelId = params.channelId
		this.worker = params.worker
		this.mediaCodecs = params.mediaCodecs || MediaChannel.defaultMediaCodecs
	}

	async initialize() {
		try {
			console.log(
				`Initializing MediaChannel ${this.channelId}`,
				this.data,
			)

			this.router = await this.worker.createRouter({
				mediaCodecs: this.mediaCodecs,
			})

			this.router.on("workerclose", () => {
				console.log(
					`Router worker closed for channel ${this.channelId}`,
				)
			})
		} catch (error) {
			console.error(
				`Error initializing MediaChannel ${this.channelId}:`,
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
		} catch (error) {
			console.error(
				`Error closing MediaChannel ${this.channelId}:`,
				error,
			)
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

		this.sendToGroupTopic("client:vc:event", {
			event: payload.event,
			userId: client.userId,
			channelId: this.channelId,
			user: {
				_id: client.context.user._id,
				username: client.context.user.username,
				avatar: client.context.user.avatar,
			},
			data: payload.data,
		})
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
			console.log(`Transport ${transport.id} DTLS state: ${dtlsState}`)
		})

		transport.on("iceconnectionstatechange", (iceState: string) => {
			console.log(`Transport ${transport.id} ICE state: ${iceState}`)
		})

		transport.on("@close", () => {
			if (client.transports) {
				client.transports.delete(transport.id)
			}
		})
	}

	_setupConsumerEvents(consumer: any, client: RTCClient) {
		consumer.on("transportclose", () => {
			console.log("consumer transport closed")
		})

		consumer.on("producerclose", () => {
			console.log("consumer producer closed")
		})
	}

	getConnectedClientsUserIds() {
		return Array.from(this.clients).map((c) => c.userId)
	}

	getConnectedClientsSerialized() {
		return Array.from(this.clients).map((c) => {
			return {
				userId: c.userId,
				voiceState: c.voiceState,
				user: {
					_id: c.context.user?._id,
					username: c.context.user?.username,
					avatar: c.context.user?.avatar,
				},
			}
		})
	}

	/**
	 * Send a event to all clients except the one provided
	 * @param {Object<RTCClient>} Origin client client
	 * @param {string} The event name
	 * @param {Object} The payload object
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
				`Error broadcasting to clients for ${client.userId}:`,
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
			console.error(`Error broadcasting to clients`, error)
		}
	}

	/**
	 * Send an event to the group topic
	 * @param {String} event
	 * @param {Object} payload
	 * @return {Promise}
	 */
	async sendToGroupTopic(event: string, payload: any) {
		const topic = `group:${this.data.group_id}`

		try {
			return await (globalThis as any).websockets.senders.toTopic(
				topic,
				`${topic}:${event}`,
				payload,
			)
		} catch (error) {
			console.error(`Error sending to group topic`, error)
		}
	}
}
