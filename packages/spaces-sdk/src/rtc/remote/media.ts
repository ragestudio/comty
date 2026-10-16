import type { RTC } from ".."
import type { Producer } from "@/rtc/producers/producer"
import type { Consumer } from "@/rtc/consumers/consumer"

import adapter from "@/adapter"
import volumeToGain from "@/utils/volumeToGain"
import loggerBase from "@/utils/logger"

import { MIN_VOLUME_DB } from "./constants"

export const logger = loggerBase.child("remote-media")

export type MediaRole = "audio" | "video"

export interface SerializedRemoteMedia {
	userId: string
	streamURL: string | null
	hasAudio: boolean
	enabled: boolean
	volume: number
}

export interface RemoteMediaCollection {
	syncState(): void
	delete(userId: string): unknown
}

/**
 * A single remote media entity for one user. It wraps the local MediaStream
 * together with the producers and consumers that feed it, so screens, cameras
 * and any future media (mic included) can share the same lifecycle.
 *
 * Audio tracks are not added to the stream; they are routed through the audio
 * adapter (volume) while video tracks feed RTCView through the stream.
 */
export class RemoteMedia {
	constructor(core: RTC, userId: string, collection: RemoteMediaCollection) {
		this.core = core
		this.userId = userId
		this.collection = collection
	}

	readonly core: RTC
	readonly userId: string
	readonly collection: RemoteMediaCollection

	enabled = false

	media: MediaStream = new MediaStream()

	producers: Map<MediaRole, Producer> = new Map()
	consumers: Map<MediaRole, Consumer> = new Map()

	volume = 100

	private destroyed = false

	get hasAudio(): boolean {
		return this.producers.has("audio")
	}

	get hasVideo(): boolean {
		return this.producers.has("video")
	}

	get streamURL(): string | null {
		const media = this.media as MediaStream & { toURL?: () => string }

		if (this.media.getVideoTracks().length === 0) {
			return null
		}

		return typeof media.toURL === "function" ? media.toURL() : null
	}

	serialize(): SerializedRemoteMedia {
		return {
			userId: this.userId,
			streamURL: this.streamURL,
			hasAudio: this.hasAudio,
			enabled: this.enabled,
			volume: this.volume,
		}
	}

	setProducer(producer: Producer) {
		const role = producer.kind as MediaRole

		this.producers.set(role, producer)

		if (this.enabled) {
			this.consume(role).then(() => this.collection.syncState())
		}
	}

	async removeProducer(role: MediaRole) {
		this.producers.delete(role)

		const consumer = this.consumers.get(role)
		this.consumers.delete(role)

		if (consumer) {
			await this.core.consumers.stop(consumer.id)
		}

		this.collection.syncState()
	}

	async enable() {
		if (this.enabled) return

		this.enabled = true

		this.collection.syncState()

		for (const role of this.producers.keys()) {
			await this.consume(role)
		}

		this.collection.syncState()
	}

	async disable() {
		if (!this.enabled) return

		this.enabled = false

		this.collection.syncState()

		await this.stopConsumers()

		this.collection.syncState()
	}

	async destroy() {
		if (this.destroyed) return

		this.destroyed = true
		this.enabled = false

		await this.stopConsumers()

		this.collection.delete(this.userId)
		this.collection.syncState()
	}

	async consume(role: MediaRole) {
		if (this.consumers.has(role)) return

		const producer = this.producers.get(role)

		if (!producer) return

		const consumer = await this.startConsumer(producer)

		if (!consumer) return

		this.consumers.set(role, consumer)

		// only video tracks feed the stream, the rest is handled by the adapter
		if (role === "video") {
			this.media.addTrack(consumer.track)
			this.requestVideoKeyframe(consumer)
		} else {
			this.applyVolume()
		}
	}

	async startConsumer(producer: Producer): Promise<Consumer | null> {
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

		const consumers = Array.from(this.consumers.values())
		this.consumers.clear()

		for (const consumer of consumers) {
			await this.core.consumers.stop(consumer.id)
		}
	}

	setVolume(volume: number) {
		this.volume = Math.max(0, Math.min(100, volume))

		this.applyVolume()
		this.collection.syncState()
	}

	applyVolume() {
		const track = this.consumers.get("audio")?.track

		if (!track) return

		adapter.trackVolume?.setVolume(
			track,
			volumeToGain(this.volume, MIN_VOLUME_DB),
		)
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
				logger.error(`failed to request keyframe: ${err.message}`)
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
}

export default RemoteMedia
