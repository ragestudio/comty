import validateRtpParameters from "./utils/validateRtpParameters"

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

	async joinClient(client) {
		try {
			if (!client.transports) {
				client.transports = new Map()
			}

			if (!client.voiceState) {
				client.voiceState = {
					muted: false,
					deafened: false,
				}
			}

			// check if client is already joined
			if (this.clients.has(client)) {
				// disconnect
				await this.leaveClient(client)
			}

			// add to set of clients
			this.clients.add(client)

			const clients = Array.from(this.clients)
			const otherClients = clients.filter(
				(c) => c.userId !== client.userId,
			)

			// Notify other clients about new client
			for (const otherClient of otherClients) {
				await otherClient.emit(`media:channel:client:joined`, {
					userId: client.userId,
					voiceState: client.voiceState,
				})
			}

			const producers = []

			for (const c of otherClients) {
				let userProducers = this.producers.get(c.userId)

				if (userProducers instanceof Map) {
					for (const [id, producer] of userProducers) {
						if (producer.closed) {
							continue
						}

						producers.push({
							kind: producer.kind,
							producerId: producer.id,
							userId: c.userId,
							channelId: this.channelId,
							appData: producer.appData,
						})
					}
				}
			}

			console.log(
				`Client ${client.userId} joined channel ${this.channelId}`,
			)

			return {
				room: this.data,
				channelId: this.channelId,
				rtpCapabilities: this.router.rtpCapabilities,
				clients: clients.map((c) => {
					const data = {
						userId: c.userId,
						voiceState: c.voiceState,
					}

					if (c.userId === client.userId) {
						data.self = true
					}

					return data
				}),
				producers: producers,
			}
		} catch (error) {
			console.error(`Error joining client ${client.userId}:`, error)
			throw error
		}
	}

	async leaveClient(client) {
		try {
			this.clients.delete(client)

			const otherClients = Array.from(this.clients).filter(
				(c) => c.userId !== client.userId,
			)

			// Cleanup producers
			const producers = this.producers.get(client.userId)

			if (producers instanceof Map) {
				for (const [id, producer] of producers) {
					if (producer && !producer.closed) {
						producer.close()
						producers.delete(id)

						// Notify other clients
						for (const otherClient of otherClients) {
							await otherClient.emit(
								`media:channel:producer:left`,
								{
									producerId: id,
									userId: client.userId,
									channelId: this.channelId,
									kind: producer.kind,
								},
							)
						}
					}
				}

				this.producers.delete(client.userId)
			}

			// Cleanup consumers
			const consumers = this.consumers.get(client.userId)

			if (Array.isArray(consumers)) {
				for (const consumer of consumers) {
					if (consumer && !consumer.closed) {
						consumer.close()
					}
				}

				this.consumers.delete(client.userId)
			}

			// Cleanup transports
			if (client.transports) {
				for (const [, transport] of client.transports) {
					if (!transport.closed) {
						transport.close()
					}
				}

				client.transports.clear()
			}

			// Notify other clients about client leaving
			for (const otherClient of otherClients) {
				await otherClient.emit(`media:channel:client:left`, {
					userId: client.userId,
					channelId: this.channelId,
				})
			}

			console.log(
				`Client ${client.userId} left channel ${this.channelId}`,
			)
		} catch (error) {
			console.error(`Error leaving client ${client.userId}:`, error)
		}
	}

	async createWebRtcTransport(client) {
		try {
			if (!client.transports) {
				client.transports = new Map()
			}

			const clientIp =
				client.ip ||
				client.socket?.remoteAddress ||
				client.socket?.request?.connection?.remoteAddress ||
				client.socket?.request?.headers?.["x-forwarded-for"]
					?.split(",")[0]
					?.trim()

			let announcedIp = globalThis.process.env.MEDIASOUP_ANNOUNCED_IP
			if (!announcedIp) {
				announcedIp =
					globalThis.process.env.NODE_ENV === "production"
						? clientIp || "127.0.0.1"
						: "127.0.0.1"
			}

			const transportConfig = {
				listenIps: [
					{
						ip:
							globalThis.process.env.MEDIASOUP_LISTEN_IP ||
							"0.0.0.0",
						announcedIp: announcedIp,
					},
				],
				enableUdp:
					globalThis.process.env.MEDIASOUP_ENABLE_UDP !== "false",
				enableTcp:
					globalThis.process.env.MEDIASOUP_ENABLE_TCP !== "false",
				preferUdp:
					globalThis.process.env.MEDIASOUP_PREFER_UDP !== "false",
				maxIncomingBitrate:
					parseInt(
						globalThis.process.env.MEDIASOUP_MAX_INCOMING_BITRATE,
					) || 6000000,
				maxOutgoingBitrate:
					parseInt(
						globalThis.process.env.MEDIASOUP_MAX_OUTGOING_BITRATE,
					) || 8000000,
			}

			const transport =
				await this.router.createWebRtcTransport(transportConfig)
			client.transports.set(transport.id, transport)

			this._setupTransportEvents(transport, client)

			return {
				id: transport.id,
				iceParameters: transport.iceParameters,
				iceCandidates: transport.iceCandidates,
				dtlsParameters: transport.dtlsParameters,
			}
		} catch (error) {
			console.error(
				`Error creating WebRTC transport for ${client.userId}:`,
				error,
			)
			throw error
		}
	}

	async connectTransport(client, payload) {
		try {
			if (!this.clients.has(client)) {
				throw new Error("Client not in channel")
			}

			const { transportId, dtlsParameters } = payload
			const transport = client.transports.get(transportId)

			if (!transport) {
				throw new Error("Transport not found")
			}

			await transport.connect({ dtlsParameters })
		} catch (error) {
			console.error(
				`Error connecting transport for ${client.userId}:`,
				error,
			)
			throw error
		}
	}

	async produce(client, payload) {
		try {
			if (!this.clients.has(client)) {
				throw new Error("Client not in channel")
			}

			const { transportId, kind, rtpParameters, appData } = payload

			if (!transportId || !kind || !rtpParameters) {
				throw new Error("Missing required parameters")
			}

			const transport = client.transports.get(transportId)

			if (!transport) {
				throw new Error("Transport not found")
			}

			// Validate RTP parameters
			validateRtpParameters(rtpParameters, kind)

			const producer = await transport.produce({
				kind,
				rtpParameters,
				appData,
			})

			// Store producers of that user
			if (!this.producers.has(client.userId)) {
				this.producers.set(client.userId, new Map())
			}

			const userProducers = this.producers.get(client.userId)

			// set producer
			userProducers.set(producer.id, producer)

			console.log("producer started::", {
				producer,
			})

			this._setupProducerEvents(producer, client, kind)

			// Notify other clients
			const otherClients = Array.from(this.clients).filter(
				(c) => c.userId !== client.userId,
			)

			for (const otherClient of otherClients) {
				await otherClient.emit(`media:channel:producer:joined`, {
					kind: producer.kind,
					producerId: producer.id,
					userId: client.userId,
					channelId: this.channelId,
					appData: appData,
				})
			}

			return { id: producer.id }
		} catch (error) {
			console.error(`Error producing for ${client.userId}:`, error)
			throw error
		}
	}

	async consume(client, payload) {
		try {
			if (!this.clients.has(client)) {
				throw new Error("Client not in channel")
			}

			const { producerId, transportId, rtpCapabilities } = payload

			if (!producerId || !transportId || !rtpCapabilities) {
				throw new Error("Missing required parameters")
			}

			const transport = client.transports.get(transportId)

			if (!transport) {
				throw new Error("Transport not found")
			}

			const canConsume = await this.router.canConsume({
				producerId,
				rtpCapabilities,
			})

			if (!canConsume) {
				throw new Error("Cannot consume")
			}

			const consumer = await transport.consume({
				producerId,
				rtpCapabilities,
				paused: false,
			})

			// Store consumer
			if (!this.consumers.has(client.userId)) {
				this.consumers.set(client.userId, [])
			}

			this.consumers.get(client.userId).push(consumer)

			this._setupConsumerEvents(consumer, client)

			return {
				id: consumer.id,
				producerId: producerId,
				kind: consumer.kind,
				rtpParameters: consumer.rtpParameters,
			}
		} catch (error) {
			console.error(`Error consuming for ${client.userId}:`, error)
			throw error
		}
	}

	async stopProduction(client, payload) {
		try {
			const { producerId } = payload

			// Get the producer for this client and kind
			const userProducers = this.producers.get(client.userId)

			if (!userProducers || !userProducers.has(producerId)) {
				// Producer doesn't exist or already closed
				return { success: true }
			}

			const producer = userProducers.get(producerId)

			if (!producer || producer.closed) {
				// Producer already closed
				return { success: true }
			}

			// Close the producer
			await producer.close()

			// Cleanup from the map
			userProducers.delete(producer.id)

			// if no more producers, remove the map
			if (userProducers.size === 0) {
				this.producers.delete(client.userId)
			}

			await this.sendToClients(client, `media:channel:producer:left`, {
				producerId: producer.id,
				userId: client.userId,
				channelId: this.channelId,
				kind: producer.kind,
				appData: producer.appData,
			})

			console.log(`Producer ${producer.id} stopped for ${client.userId}`)

			return { success: true }
		} catch (error) {
			console.error(
				`Error stopping production for ${client.userId}:`,
				error,
			)
			throw error
		}
	}

	async close() {
		try {
			console.log(`Closing MediaChannel ${this.channelId}`)

			// Close all producers
			for (const [, producers] of this.producers) {
				if (producers instanceof Map) {
					for (const [, producer] of producers) {
						if (producer && !producer.closed) {
							producer.close()
						}
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

	_setupProducerEvents(producer, client, kind) {
		producer.on("transportclose", () => {
			console.log(`Producer ${producer.id} transport closed`)
			this.removeProducer(client.userId, kind)
		})
	}

	_setupConsumerEvents(consumer, client) {
		consumer.on("transportclose", () => {
			console.log("consumer transport closed")
			this.removeConsumer(client.userId, consumer)
		})

		consumer.on("producerclose", () => {
			console.log("consumer producer closed")
			this.removeConsumer(client.userId, consumer)
		})
	}

	removeProducer(userId, kind) {
		const userProducers = this.producers.get(userId)

		if (userProducers instanceof Map) {
			userProducers.delete(kind)

			if (userProducers.size === 0) {
				this.producers.delete(userId)
			}
		}
	}

	removeConsumer(userId, consumer) {
		const userConsumers = this.consumers.get(userId)

		if (Array.isArray(userConsumers)) {
			const index = userConsumers.indexOf(consumer)

			if (index !== -1) {
				userConsumers.splice(index, 1)
			}

			if (userConsumers.length === 0) {
				this.consumers.delete(userId)
			}
		}
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
