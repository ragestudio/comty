export default async function (client, payload) {
	try {
		const { producerId } = payload

		// Get the producer for this client and kind
		const userProducers = this.producers.get(client.userId)

		if (!userProducers || !userProducers.has(producerId)) {
			// Producer doesn't exist or already closed
			return { success: true }
		}

		const producerInst = userProducers.get(producerId)

		if (!producerInst || producerInst.producer.closed) {
			// Producer already closed
			return { success: true }
		}

		// Close the producer
		await producerInst.producer.close()

		// Cleanup from the map
		userProducers.delete(producerInst.id)

		// if no more producers, remove the map
		if (userProducers.size === 0) {
			this.producers.delete(client.userId)
		}

		await this.sendToClients(client, `media:channel:producer:left`, {
			producerId: producerInst.id,
			userId: client.userId,
			channelId: this.channelId,
			kind: producerInst.producer.kind,
			appData: producerInst.producer.appData,
		})

		console.log(`Producer ${producerInst.id} stopped for ${client.userId}`)

		return { success: true }
	} catch (error) {
		console.error(`Error stopping production for ${client.userId}:`, error)
		throw error
	}
}
