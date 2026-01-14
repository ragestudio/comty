import consumeHandler from "./handlers/consume"
import produceHandler from "./handlers/produce"

import joinClientHandler from "./handlers/joinClient"
import leaveClientHandler from "./handlers/leaveClient"

import connectTransportHandler from "./handlers/connectTransport"
import createTransportHandler from "./handlers/createTransport"

export default class MediaChannel {
	constructor(params) {
		this.params = params
		this.data = params.data
		this.channelId = params.channelId
		this.worker = params.worker
		this.mediaCodecs = params.mediaCodecs || MediaChannel.defaultMediaCodecs
	}

	static defaultMediaCodecs = [
		{
			kind: "audio",
			mimeType: "audio/opus",
			clockRate: 48000,
			channels: 2,
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

	router = null
	clients = new Set()
	producers = new Map()
	consumers = new Map()

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
				for (const [id, { producer }] of userProducers) {
					if (producer && !producer.closed) {
						producer.close()
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

	async handleClientEvent(client, payload) {
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
	}

	async handleSoundpadDispatch(client, payload) {
		this.broadcastToClients(`media:channel:soundpad:dispatch`, {
			userId: client.userId,
			data: payload,
		})
	}

	updateClientVoiceState(client, update) {
		for (const c of this.clients) {
			if (c.userId === client.userId) {
				c.voiceState = {
					...c.voiceState,
					...update,
				}
			}
		}
	}

	_setupTransportEvents(transport, client) {
		transport.on("dtlsstatechange", (dtlsState) => {
			console.log(`Transport ${transport.id} DTLS state: ${dtlsState}`)
		})

		transport.on("iceconnectionstatechange", (iceState) => {
			console.log(`Transport ${transport.id} ICE state: ${iceState}`)
		})

		transport.on("@close", () => {
			if (client.transports) {
				client.transports.delete(transport.id)
			}
		})
	}

	_setupConsumerEvents(consumer, client) {
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
			}
		})
	}

	/**
	 * Send a event to all clients except the one provided
	 * @param {Object<Client>} Origin client client
	 * @param {string} The event name
	 * @param {Object} The payload object
	 */
	async sendToClients(client, event, payload) {
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
	 * @param {string} The event name
	 * @param {Object} The payload object
	 */
	async broadcastToClients(event, payload) {
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
	async sendToGroupTopic(event, payload) {
		const topic = `group:${this.data.group_id}`

		try {
			return await globalThis.websockets.senders.toTopic(
				topic,
				`${topic}:${event}`,
				payload,
			)
		} catch (error) {
			console.error(`Error sending to group topic`, error)
		}
	}
}
