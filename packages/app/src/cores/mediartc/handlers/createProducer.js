export default async function (payload) {
	if (!this.device || !this.sendTransport) {
		throw new Error("Device or transport not ready")
	}

	const producer = await this.sendTransport.produce(payload)

	producer.on("@close", async () => {
		try {
			await this.socket.call("channel:stop_production", {
				producerId: producer.id,
				transportId: this.sendTransport.id,
				kind: producer.kind,
				rtpParameters: producer.rtpParameters,
				appData: producer.appData,
			})
		} catch (error) {
			this.console.error("Failed to dispatch stop production:", error)
		}
	})

	return producer
}
