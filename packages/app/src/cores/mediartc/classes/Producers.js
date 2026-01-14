export default class Producers extends Map {
	constructor(core, data) {
		super(data)
		this.core = core

		if (!core) {
			throw new Error("Core not provided")
		}
	}

	produce = async (payload) => {
		if (!this.core.device || !this.core.sendTransport) {
			throw new Error("Device or transport not ready")
		}

		const producer = await this.core.sendTransport.produce(payload)

		producer.self = true
		producer.observer.on("close", () => this.onSelfProducerClosed(producer))

		this.set(producer.id, producer)

		return producer
	}

	getSelfProducers() {
		return Array.from(this.values()).filter((producer) => producer.self)
	}

	onSelfProducerClosed(producer) {
		this.delete(producer.id)
	}
}
