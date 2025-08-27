export default async function (client) {
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
		const otherClients = clients.filter((c) => c.userId !== client.userId)

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

					producers.push(producer.seralize())
				}
			}
		}

		console.log(`Client ${client.userId} joined channel ${this.channelId}`)

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
