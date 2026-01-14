import setFind from "@shared-utils/setFind"

export default async function (client, { emitEventToSelf = false } = {}) {
	try {
		const clientInst = setFind(this.clients, (c) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			return null
		}

		this.clients.delete(clientInst)

		const clientProducers = this.producers.get(client.userId)

		const otherClients = Array.from(this.clients).filter(
			(c) => c.userId !== client.userId,
		)

		if (clientProducers instanceof Map) {
			for (const [id, { producer }] of clientProducers) {
				if (producer && !producer.closed) {
					producer.close()
					clientProducers.delete(id)
				}
			}

			this.producers.delete(client.userId)
		}

		// Cleanup consumers
		const clientConsumers = this.consumers.get(client.userId)

		if (Array.isArray(clientConsumers)) {
			for (const consumer of clientConsumers) {
				if (consumer && !consumer.closed) {
					consumer.close()
				}
			}

			this.consumers.delete(client.userId)
		}

		// Cleanup transports
		if (clientInst.transports) {
			for (const [, transport] of clientInst.transports) {
				if (!transport.closed) {
					transport.close()
				}
			}

			clientInst.transports.clear()
		}

		// Notify other clients about client leaving
		for (const otherClient of otherClients) {
			await otherClient.emit(`media:channel:client:left`, {
				userId: client.userId,
				channelId: this.channelId,
			})
		}

		// publish to group topic
		await this.sendToGroupTopic("client:left", {
			userId: clientInst.userId,
			channelId: this.channelId,
			channelClients: this.getConnectedClientsSerialized(),
		})

		if (emitEventToSelf === true) {
			// notify the client that they left the channel
			await clientInst.emit(`media:channel:disconnected`, {
				channelId: this.channelId,
			})
		}

		console.log(`Client ${client.userId} left channel ${this.channelId}`)

		return {
			userId: client.userId,
			channelId: this.channelId,
		}
	} catch (error) {
		console.error(`Error leaving client ${client.userId}:`, error)
	}
}
