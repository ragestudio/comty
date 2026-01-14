export default async function (client) {
	try {
		client.transports = new Map()

		client.voiceState = {
			muted: false,
			deafened: false,
		}

		// add to set of clients
		this.clients.add(client)

		const clients = Array.from(this.clients)

		// Notify other clients about new client
		const otherClients = clients.filter((c) => c.userId !== client.userId)

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

		// publish to group topic
		await this.sendToGroupTopic("client:joined", {
			userId: client.userId,
			channelId: this.channelId,
			channelClients: this.getConnectedClientsSerialized(),
		})

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
