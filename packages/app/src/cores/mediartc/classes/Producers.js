export default class Producers extends Map {
	constructor(core, data) {
		super(data)
		this.core = core

		if (!core) {
			throw new Error("Core not provided")
		}
	}

	setRemote(producer) {
		if (!producer) {
			return null
		}

		producer.remote = true

		this.set(producer.producerId, producer)
		this.core.state.remoteProducers.push(producer)
	}

	delRemote(producer) {
		if (!producer) {
			return null
		}

		this.delete(producer.producerId)

		this.core.state.remoteProducers =
			this.core.state.remoteProducers.filter(
				(p) => p.id !== producer.producerId,
			)
	}

	produce = async (payload) => {
		if (!this.core.device || !this.core.sendTransport) {
			throw new Error("Device or send transport not ready")
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

	async onSelfProducerClosed(producer) {
		if (!producer) {
			return null
		}

		this.delete(producer.id)

		await this.core.socket.emit("channel:produce:stop", {
			producerId: producer.id,
		})
	}
}
