import type Producer from "./Producer"
import type MediaRTCCore from "../mediartc.core"
import Consumer from "./Consumer"

type ScreenAudioObjects = {
	stream: MediaStream
	source: MediaStreamAudioSourceNode
}

export class Screen {
	constructor(producer: Producer) {
		this.producer = producer
	}

	active: boolean = false
	producer: Producer = null
	media: MediaStream = new MediaStream()

	audioObjs: ScreenAudioObjects[] = []
	audioGainNode: GainNode = null

	consumersIds = []

	get rtc() {
		return app.cores.mediartc.instance() as MediaRTCCore
	}

	get isSysAudioOutputAvailable() {
		return !!(
			this.rtc.self.sysAudio &&
			this.rtc.self.sysAudio.outputCtx &&
			this.rtc.self.sysAudio.pcmOutputWorklet
		)
	}

	get shouldMuteVideo() {
		return this.isSysAudioOutputAvailable
	}

	start = async () => {
		await this.attach(this.producer)

		// handle childrens producers
		if (
			this.producer.appData &&
			Array.isArray(this.producer.appData.childrens)
		) {
			for (const childProducerId of this.producer.appData.childrens) {
				await this.attach(childProducerId)
			}
		}

		this.active = true
	}

	stop = async () => {
		// disconnect audio routing
		this.detachAudio()

		if (this.media) {
			// stop the tracks
			this.media.getTracks().forEach((track) => track.stop())
		}

		// if the screens map stills having this screen, remove it
		if (this.rtc.screens.has(this.producer.userId)) {
			this.rtc.screens.delete(this.producer.userId)
		}

		// stop all consumers
		for (const consumerId of this.consumersIds) {
			await this.rtc.consumers.stop(consumerId)
		}

		this.active = false
	}

	async attach(producer: Producer | string) {
		if (typeof producer === "string") {
			producer = this.rtc.producers.get(producer)
		}

		if (!producer) return null

		// try to get the consumer
		let consumer = await this.consume(producer)

		// route audio tracks through sysaudio output to avoid capture feedback.
		// when routed through sysaudio, skip adding to media stream to prevent audio duplication
		if (producer.kind === "audio" && !producer.self) {
			if (!this.attachToSAOutput(consumer.track)) {
				this.media.addTrack(consumer.track)
			}
		} else {
			this.media.addTrack(consumer.track)
		}

		if (producer.kind === "video") {
			this.requestVideoKeyframeUntilDecoded(consumer)
		}

		return consumer
	}

	async consume(producer: Producer): Promise<Consumer> {
		// try to get the consumer
		let consumer = this.rtc.consumers.findByProducerId(producer.id)

		// if not found, start a new consumer
		if (!consumer) {
			consumer = await this.rtc.consumers.start(producer)
		}

		if (!consumer) {
			throw new Error("Cannot consume from the producer")
		}

		// if consumer is paused, resume it
		if (consumer.paused) {
			consumer.resume()
		}

		// add to the consumer the events when the consumer is ended
		consumer.observer.on("close", this.stop)
		consumer.observer.on("trackended", this.stop)

		// add the id
		this.consumersIds.push(consumer.id)

		return consumer
	}

	attachToSAOutput = (track: MediaStreamTrack) => {
		if (!this.isSysAudioOutputAvailable) return false

		const ctx = this.rtc.self.sysAudio.outputCtx

		const stream = new MediaStream([track])
		const source = ctx.createMediaStreamSource(stream)

		this.audioGainNode = ctx.createGain()
		this.audioGainNode.gain.value = 1

		source.connect(this.audioGainNode)
		this.audioGainNode.connect(this.rtc.self.sysAudio.pcmOutputWorklet)

		this.audioObjs.push({ stream, source })

		return true
	}

	detachAudio = () => {
		for (const node of this.audioObjs) {
			try {
				node.stream.getTracks().forEach((t) => t.stop())
				node.source.disconnect()
				this.audioGainNode.disconnect()
			} catch (e) {}
		}

		this.audioObjs = []
		this.audioGainNode = null
	}

	setVolume = (volume) => {
		if (this.audioGainNode) {
			this.audioGainNode.gain.value = volume / 100
		}
	}

	requestVideoKeyframeUntilDecoded = (consumer: Consumer) => {
		let attempts = 0

		const requestKeyframe = () => {
			try {
				if (this.active && !consumer.closed) {
					this.rtc.socket.emit("channel:request_keyframe", {
						consumer_id: consumer.id,
					})
				}
			} catch (err) {
				this.rtc.console.error(
					`Failed to request keyframe for consumer [${consumer.id}]: ${err.message}`,
				)
			}
		}

		requestKeyframe()

		const checkStatsInterval = setInterval(async () => {
			if (!this.active || consumer.closed || attempts > 10) {
				clearInterval(checkStatsInterval)
				return
			}
			attempts++

			try {
				const stats = await consumer.getStats()
				let framesDecoded = 0

				stats.forEach((report) => {
					if (
						report.type === "inbound-rtp" &&
						report.kind === "video"
					) {
						framesDecoded = report.framesDecoded || 0
					}
				})

				if (framesDecoded === 0) {
					requestKeyframe()
				} else {
					clearInterval(checkStatsInterval)
				}
			} catch (err) {}
		}, 1000)
	}
}

export default Screen
