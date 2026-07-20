import type Producer from "./Producer"
import type MediaRTCCore from "../mediartc.core"

type ScreenAudioObjects = {
	stream: MediaStream
	source: MediaStreamAudioSourceNode
	gainNode: GainNode
	destination: AudioNode
}

export default class Screen {
	constructor(producer: Producer) {
		this.producer = producer
		this.media = new MediaStream()
		this.audioObjs = []
		this.audioGainNode = null
		this.shouldMuteVideo = false
	}

	media: MediaStream = null
	producer: Producer = null

	audioObjs: ScreenAudioObjects[] = []
	audioGainNode: GainNode = null
	shouldMuteVideo: boolean = false

	consumersIds = []

	get rtc() {
		return app.cores.mediartc.instance() as MediaRTCCore
	}

	start = async () => {
		await this.appendFromProducer(this.producer.id)

		// handle childrens producers
		if (
			this.producer.appData &&
			Array.isArray(this.producer.appData.childrens)
		) {
			for (const childProducerId of this.producer.appData.childrens) {
				await this.appendFromProducer(childProducerId)
			}
		}
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
	}

	setVolume = (volume) => {
		if (this.audioGainNode) {
			this.audioGainNode.gain.value = volume / 100
		}
	}

	appendFromProducer = async (producer_id) => {
		const producer = this.rtc.producers.get(producer_id)

		if (!producer) {
			console.warn("Producer not found", producer_id)
			return null
		}

		// try to get the consumer
		let consumer = this.rtc.consumers.findByProducerId(producer.id)

		// if not found, start a new consumer
		if (!consumer) {
			console.log("Starting new consumer", { producer })
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

		// add the track to the media stream.
		// never add self audio tracks
		const isSelfAudio = producer.self && consumer.kind === "audio"

		if (!isSelfAudio) {
			this.media.addTrack(consumer.track)
		}

		// route audio tracks through sysaudio output to avoid capture feedback.
		if (consumer.kind === "audio" && !producer.self) {
			this.attachAudio(consumer.track)
		}

		// add the id
		this.consumersIds.push(consumer.id)

		return consumer
	}

	attachAudio = (track) => {
		const hasSysAudio = !!(
			this.rtc.self.sysAudio && this.rtc.self.sysAudio.outputCtx
		)

		// only route through sysaudio native output, never through voice audioOutput
		// voice path is for low-latency speech and gets silenced on deafen
		if (!hasSysAudio) return

		const ctx = this.rtc.self.sysAudio.outputCtx
		const destination = this.rtc.self.sysAudio.outputBus

		if (!ctx || !destination) return

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
}
