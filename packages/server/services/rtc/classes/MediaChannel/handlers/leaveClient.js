export default async function (client) {
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
						await otherClient.emit(`media:channel:producer:left`, {
							...producer,
							channelId: this.channelId,
							userId: client.userId,
						})
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

		console.log(`Client ${client.userId} left channel ${this.channelId}`)
	} catch (error) {
		console.error(`Error leaving client ${client.userId}:`, error)
	}
}
