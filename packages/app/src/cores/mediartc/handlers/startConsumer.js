export default async function ({ producerId, userId, kind, appData }) {
	try {
		if (!this.device || !this.recvTransport) {
			throw new Error("Device or transport not ready")
		}

		// if consumer already exists, return it
		if (this.consumers.has(producerId)) {
			return this.consumers.get(producerId)
		}

		this.console.log("Starting consumer", {
			producerId,
			userId,
			kind,
			appData,
		})

		const consumerInfo = await this.socket.call("channel:consume", {
			producerId: producerId,
			transportId: this.recvTransport.id,
			rtpCapabilities: this.device.rtpCapabilities,
		})

		const consumer = await this.recvTransport.consume({
			id: consumerInfo.id,
			producerId: consumerInfo.producerId,
			kind: consumerInfo.kind,
			rtpParameters: consumerInfo.rtpParameters,
			appData: appData,
		})

		consumer.userId = userId

		// Consumer event handlers
		consumer.on("transportclose", () => {
			console.log("consumer transport closed")

			this.handlers.stopConsumer(producerId, userId)
		})

		consumer.on("producerclose", () => {
			console.log("consumer producer closed")
			this.handlers.stopConsumer(producerId, userId)
		})

		consumer.on("close", () => {
			console.log("consumer close")
			this.handlers.stopConsumer(producerId, userId)
		})

		// add to consumers
		this.consumers.set(producerId, consumer)
		this.state.availableConsumers.push(producerId)

		return consumer
	} catch (error) {
		this.console.error("Error creating consumer:", error)
	}
}
