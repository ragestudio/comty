import produceHandler from "./handlers/produce"
import consumeHandler from "./handlers/consume"

import stopProduceHandler from "./handlers/stopProduce"
//import stopConsumeHandler from "./handlers/stopConsume"

import joinClientHandler from "./handlers/joinClient"
import leaveClientHandler from "./handlers/leaveClient"

import createTransportHandler from "./handlers/createTransport"
import connectTransportHandler from "./handlers/connectTransport"

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
			console.log(`Initializing MediaChannel ${this.channelId}`)

			this.router = await this.worker.createRouter({
				mediaCodecs: this.mediaCodecs,
			})

			console.log(
				`MediaChannel ${this.channelId} initialized successfully`,
			)

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

	stopProduce = stopProduceHandler.bind(this)

	async close() {
		try {
			console.log(`Closing MediaChannel ${this.channelId}`, {
				producers: this.producers,
			})

			// Close all producers
			// FIXME: fix producer close
			for (const [userId, userProducers] of this.producers) {
				for (const [id, { producer }] of userProducers) {
					if (producer && !producer.closed) {
						producer.close()
					}
				}
			}

			this.producers.clear()

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

			// Close router
			if (this.router && !this.router.closed) {
				this.router.close()
			}

			this.clients.clear()

			console.log(`MediaChannel ${this.channelId} closed successfully`)
		} catch (error) {
			console.error(
				`Error closing MediaChannel ${this.channelId}:`,
				error,
			)
		}
	}

	async handleClientEvent(client, payload) {
		console.log("handleClientEvent", payload)

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
		console.log("handleSoundpadDispatch", payload)

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

	async broadcastToClients(event, payload) {
		try {
			for (const client of this.clients) {
				await client.emit(event, payload)
			}
		} catch (error) {
			console.error(`Error broadcasting to clients`, error)
		}
	}
}
