import type { RTC } from ".."
import type { ProducerOptions } from "mediasoup-client/types"
import type { ProducerAppData } from "@comty/shared/types/rtc/producer"
import type { Producer } from "./producer"

import { attachSpeakingDetection } from "../speaking"
import loggerBase from "@/utils/logger"

export const logger = loggerBase.child("producers")

export type ProduceParams = ProducerOptions<ProducerAppData>

export type ProduceOptions = {
	// local speaking detection, attached before negotiation so the encoded
	// streams can still be created on the rtp sender in chromium browsers
	onSpeaking?: (isSpeaking: boolean) => void
}

// unique ids to route the speaking detector messages of the local producers
let speakerIdSequence = 0
const nextSpeakerId = () => `self-producer-${++speakerIdSequence}`

export class Producers extends Map<string, Producer> {
	constructor(core: RTC, data?: Iterable<readonly [string, Producer]>) {
		super(data)
		this.core = core
	}

	core: RTC

	speakingDetectors: Map<string, () => void> = new Map()

	async produce(
		payload: ProduceParams,
		options: ProduceOptions = {},
	): Promise<Producer> {
		if (!this.core.device) {
			throw new Error("Device not available")
		}

		if (!this.core.transports.send) {
			throw new Error("Send transport not available")
		}

		if (!this.core.userId) {
			throw new Error("User ID not available")
		}

		let detachSpeaking: (() => void) | null = null

		let producer: Producer

		if (options.onSpeaking) {
			payload.onRtpSender = (rtpSender) => {
				detachSpeaking = attachSpeakingDetection(
					{
						id: nextSpeakerId(),
						role: "sender",
						rtpSender,
					},
					options.onSpeaking!,
				)
			}
		}

		try {
			producer =
				(await this.core.transports.send.produce<ProducerAppData>(
					payload,
				)) as Producer
		} catch (error) {
			this.core.eventBus.emit("rtc:producer:error", { error })
			logger.error("Failed to produce error", error)

			throw error
		}

		producer.userId = this.core.userId
		producer.self = true
		producer.remote = false

		producer.observer.on("close", () => this.onSelfProducerClosed(producer))
		producer.on("trackended", () => producer.close())

		// auto start
		if (producer.paused) {
			producer.resume()
		}

		this.set(producer.id, producer)

		if (detachSpeaking) {
			this.speakingDetectors.set(producer.id, detachSpeaking)
		}

		this.core.eventBus.emit("rtc:producer:joined", producer)
		logger.debug("Producer joined", producer)

		return producer
	}

	detachSpeakingDetection(producerId: string) {
		const detach = this.speakingDetectors.get(producerId)

		if (!detach) return

		detach()
		this.speakingDetectors.delete(producerId)
	}

	onSelfProducerClosed(producer: Producer) {
		if (!producer) return null

		this.detachSpeakingDetection(producer.id)
		this.delete(producer.id)

		this.core.eventBus.emit("rtc:producer:left", producer)

		if (!this.core.socket) return null

		this.core.socket.emit("channel:producer_stop", {
			producerId: producer.id,
		})
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
