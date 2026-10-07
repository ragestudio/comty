import type { ProducerOptions } from "mediasoup-client/types"
import type { RTC } from ".."
import type { Producer } from "./producer"

import { attachSpeakingDetection } from "../speaking"

export class Producers extends Map<string, Producer> {
	constructor(core: RTC, data?: Iterable<readonly [string, Producer]>) {
		super(data)
		this.core = core
	}

	core: RTC

	speakingDetectors: Map<string, () => void> = new Map()

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
		producer.remote = false

		producer.observer.on("close", () => this.onSelfProducerClosed(producer))
		producer.on("trackended", () => producer.close())

		if (producer.paused) {
			producer.resume()
		}

		if (
			producer.kind === "audio" &&
			producer.appData?.mediaTag === "user-mic"
		) {
			console.debug("[webrtc] Mic producer opened")
			this.core.self.micProducerId = producer.id

			this.setupSpeakingDetection(producer, (isSpeaking) => {
				this.core.setState({
					isSpeaking: isSpeaking,
				})
			})
		}

		this.set(producer.id, producer)

		return producer
	}

	setupSpeakingDetection = (
		producer: Producer,
		callback: (isSpeaking: boolean) => void,
	) => {
		const detach = attachSpeakingDetection(
			{
				id: producer.id,
				role: "sender",
				rtpSender: producer.rtpSender,
			},
			callback,
		)

		if (detach) {
			this.speakingDetectors.set(producer.id, detach)
		}
	}

	detachSpeakingDetection(producerId: string) {
		const detach = this.speakingDetectors.get(producerId)

		if (!detach) return

		detach()
		this.speakingDetectors.delete(producerId)
	}

	onSelfProducerClosed(producer: Producer) {
		if (!producer || !this.core.socket) return null

		this.detachSpeakingDetection(producer.id)
		this.delete(producer.id)

		this.core.socket.emit("channel:producer_stop", {
			producerId: producer.id,
		})

		if (
			producer.kind === "audio" &&
			producer.appData?.mediaTag === "user-mic"
		) {
			console.debug("[webrtc] Mic producer closed")
			this.core.self.micProducerId = null
			this.core.setState({ isSpeaking: false })
		}
	}

	setRemote(producer: Producer): Producer | null {
		if (!producer) return null

		producer.remote = true

		this.set(producer.producerId, producer)

		return producer
	}

	delRemote(producer: Producer): Producer | null {
		if (!producer) {
			return null
		}

		this.delete(producer.producerId)

		return null
	}

	getSelfProducers() {
		return Array.from(this.values()).filter((producer) => producer.self)
	}

	clear(): void {
		for (const detach of this.speakingDetectors.values()) {
			detach()
		}

		this.speakingDetectors.clear()

		super.clear()
	}
}

export default Producers
