import type { RTC } from ".."
import type { Producer } from "@/rtc/producers/producer"
import type { Consumer } from "@/rtc/consumers/consumer"

import adapter from "@/adapter"

export interface SerializedScreen {
	userId: string
	streamURL: string | null
	hasAudio: boolean
	enabled: boolean
	volume: number
}

export class RemoteScreen {
	constructor(core: RTC, userId: string) {
		this.core = core
		this.userId = userId
	}

	core: RTC
	userId: string

	enabled = false

	media: MediaStream = new MediaStream()

	videoProducer: Producer | null = null
	audioProducer: Producer | null = null

	videoConsumer: Consumer | null = null
	audioConsumer: Consumer | null = null

	volume = 100

	get hasAudio(): boolean {
		return this.audioProducer !== null
	}

	get streamURL(): string | null {
		const media = this.media as MediaStream & { toURL?: () => string }

		if (this.media.getVideoTracks().length === 0) {
			return null
		}

		return typeof media.toURL === "function" ? media.toURL() : null
	}

	serialize(): SerializedScreen {
		return {
			userId: this.userId,
			streamURL: this.streamURL,
			hasAudio: this.hasAudio,
			enabled: this.enabled,
			volume: this.volume,
		}
	}

	setVideoProducer(producer: Producer) {
		this.videoProducer = producer

		if (this.enabled) {
			this.consumeVideo().then(() => this.core.screens.syncState())
		}
	}

	setAudioProducer(producer: Producer) {
		this.audioProducer = producer

		if (this.enabled) {
			this.consumeAudio().then(() => this.core.screens.syncState())
		}
	}

	async enable() {
		if (this.enabled) return

		this.enabled = true

		await this.consumeVideo()
		await this.consumeAudio()

		this.core.screens.syncState()
	}

	async disable() {
		if (!this.enabled) return

		this.enabled = false

		await this.stopConsumers()

		this.core.screens.syncState()
	}

	async destroy() {
		if (this.destroyed) return

		this.destroyed = true
		this.enabled = false

		await this.stopConsumers()

		this.core.screens.delete(this.userId)
		this.core.screens.syncState()
	}

	async detachAudio() {
		this.audioProducer = null

		const consumer = this.audioConsumer
		this.audioConsumer = null

		if (consumer) {
			await this.core.consumers.stop(consumer.id)
		}

		this.core.screens.syncState()
	}

	async consumeVideo() {
		if (this.videoConsumer || !this.videoProducer) return

		const consumer = await this.consume(this.videoProducer)

		if (!consumer) return

		this.videoConsumer = consumer
		this.media.addTrack(consumer.track)

		this.requestVideoKeyframe(consumer)
	}

	async consumeAudio() {
		if (this.audioConsumer || !this.audioProducer) return

		const consumer = await this.consume(this.audioProducer)

		if (!consumer) return

		this.audioConsumer = consumer

		this.applyVolume()
	}

	async consume(producer: Producer): Promise<Consumer | null> {
		let consumer: Consumer | null = null

		const existing = this.core.consumers.findByProducerId(
			producer.producerId,
		)

		if (existing) {
			consumer = existing
		} else {
			const created = await this.core.consumers.start({
				kind: producer.kind,
				producerId: producer.producerId,
				userId: this.userId,
				appData: producer.appData,
			})

			if (created) {
				consumer = created
			}
		}

		if (!consumer) return null

		consumer.observer.on("close", () => this.disable())
		consumer.observer.on("trackended", () => this.disable())

		return consumer
	}

	async stopConsumers() {
		const media = this.media
		this.media = new MediaStream()

		if (media) {
			media.getTracks().forEach((track) => track.stop())

			const releasable = media as MediaStream & {
				release?: (releaseTracks?: boolean) => void
			}

			releasable.release?.(false)
		}

		const videoConsumer = this.videoConsumer
		const audioConsumer = this.audioConsumer

		this.videoConsumer = null
		this.audioConsumer = null

		if (videoConsumer) {
			await this.core.consumers.stop(videoConsumer.id)
		}

		if (audioConsumer) {
			await this.core.consumers.stop(audioConsumer.id)
		}
	}

	setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(100, volume))

		this.applyVolume()
		this.core.screens.syncState()
	}

	applyVolume() {
		const track = this.audioConsumer?.track

		if (!track) return

		adapter.trackVolume?.setVolume(track, this.volume / 100)
	}

	requestVideoKeyframe(consumer: Consumer) {
		let attempts = 0

		const request = () => {
			try {
				if (this.enabled && !consumer.closed) {
					this.core.socket?.emit("channel:request_keyframe", {
						consumer_id: consumer.id,
					})
				}
			} catch (err: any) {
				console.error(
					`[screens] failed to request keyframe: ${err.message}`,
				)
			}
		}

		request()

		const interval = setInterval(async () => {
			if (!this.enabled || consumer.closed || attempts >= 10) {
				clearInterval(interval)
				return
			}

			attempts++

			try {
				const stats = await consumer.getStats()
				let framesDecoded = 0

				stats.forEach((report: any) => {
					if (
						report.type === "inbound-rtp" &&
						report.kind === "video"
					) {
						framesDecoded = report.framesDecoded || 0
					}
				})

				if (framesDecoded === 0) {
					request()
				} else {
					clearInterval(interval)
				}
			} catch (err) {
				clearInterval(interval)
			}
		}, 1000)
	}

	private destroyed = false
}

export default RemoteScreen
