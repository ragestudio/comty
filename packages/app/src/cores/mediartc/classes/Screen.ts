import type Producer from "./Producer"
import type MediaRTCCore from "../mediartc.core"
import Consumer from "./Consumer"

type ScreenAudioObjects = {
	stream: MediaStream
	source: MediaStreamAudioSourceNode
	gainNode: GainNode
	destination: AudioNode
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
	shouldMuteVideo: boolean = false

	consumersIds = []

	get rtc() {
		return app.cores.mediartc.instance() as MediaRTCCore
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
		const hasSysAudio = !!(
			this.rtc.self.sysAudio && this.rtc.self.sysAudio.outputCtx
		)

		// only route through sysaudio native output, never through voice audioOutput
		// voice path is for low-latency speech and gets silenced on deafen
		if (!hasSysAudio) return false

		const ctx = this.rtc.self.sysAudio.outputCtx
		const destination = this.rtc.self.sysAudio.outputBus

		if (!ctx || !destination) return false

		const stream = new MediaStream([track])
		const source = ctx.createMediaStreamSource(stream)
		const gainNode = ctx.createGain()
		gainNode.gain.value = 1

		source.connect(gainNode)
		gainNode.connect(destination)

		this.audioObjs.push({ stream, source, gainNode, destination })
		this.audioGainNode = gainNode

		// signal that video should be muted since audio goes through sysaudio
		this.shouldMuteVideo = true

		return true
	}

	detachAudio = () => {
		for (const node of this.audioObjs) {
			try {
				node.source.disconnect()
				node.gainNode.disconnect()
				node.stream.getTracks().forEach((t) => t.stop())
			} catch (e) {}
		}

		this.audioObjs = []
		this.audioGainNode = null
		this.shouldMuteVideo = false
	}

	setVolume = (volume) => {
		if (this.audioGainNode) {
			this.audioGainNode.gain.value = volume / 100
		}
	}
}

export default Screen
