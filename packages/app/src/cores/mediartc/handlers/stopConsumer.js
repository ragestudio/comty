export default async function ({ producerId, userId }) {
	try {
		const consumer = this.consumers.get(producerId)

		if (!consumer) {
			// no consumer found
			return false
		}

		if (consumer.closed) {
			// consumer already closed
			this.consumers.delete(producerId)

			return false
		}

		this.console.log("Stopping consumer", {
			producerId: producerId,
			userId: userId,
			consumer: consumer,
		})

		// stop the consumer
		consumer.close()

		// delte from consumers
		this.consumers.delete(producerId)

		// delete from available consumers
		this.state.availableConsumers = this.state.availableConsumers.filter(
			(id) => id !== producerId,
		)

		return consumer
	} catch (error) {
		this.console.error("Error stopping consumer:", error)
		throw error
	}
}
