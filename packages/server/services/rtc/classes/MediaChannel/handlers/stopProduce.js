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

		return { success: true }
	} catch (error) {
		console.error(`Error stopping production for ${client.userId}:`, error)
		throw error
	}
}
