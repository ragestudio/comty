export default async function (client, payload) {
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
