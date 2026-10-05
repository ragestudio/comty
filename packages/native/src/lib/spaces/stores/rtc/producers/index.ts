import type { ProducerOptions } from "mediasoup-client/types"
import type { RTC } from ".."
import type { Producer } from "./producer"

export class Producers extends Map<string, Producer> {
	constructor(core: RTC, data?: Iterable<readonly [string, Producer]>) {
		super(data)
		this.core = core
	}

	core: RTC

	async produce(payload: ProducerOptions): Promise<Producer> {
		if (!this.core.device) {
			throw new Error("Device not available")
		}

		if (!this.core.transports.send) {
			throw new Error("Send transport not available")
		}

		if (!this.core.userId) {
			throw new Error("User ID not available")
		}

		const producer = (await this.core.transports.send.produce(
			payload,
		)) as Producer

		producer.userId = this.core.userId
		producer.self = true

		producer.observer.on("close", () => this.onSelfProducerClosed(producer))
		producer.on("trackended", () => producer.close())

		if (producer.paused) {
			producer.resume()
		}

		this.set(producer.id, producer)

		return producer
	}

	onSelfProducerClosed(producer: Producer) {
		if (!producer || !this.core.socket) return null

		this.delete(producer.id)

		this.core.socket.emit("channel:producer_stop", {
			producerId: producer.id,
		})
	}

	setRemote(producer: Producer): Producer | null {
		return null
	}

	delRemote(producer: Producer): Producer | null {
		return null
	}

	getSelfProducers() {
		return Array.from(this.values()).filter((producer) => producer.self)
	}

	clear(): void {
		super.clear()
	}
}

export default Producers
