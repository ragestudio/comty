import type { SpeakingStrategy, SpeakingTarget } from "../types"

import { getAudioContext } from "../../web/audio-context"

const TICK_MS = 150
const SPEAKING_THRESHOLD = 0.01
const SILENCE_HOLD_MS = 400

function getTrack(target: SpeakingTarget): MediaStreamTrack | null {
	if (target.track?.kind === "audio") return target.track

	const receiverTrack = target.rtpReceiver?.track
	if (receiverTrack?.kind === "audio") return receiverTrack

	const senderTrack = target.rtpSender?.track
	if (senderTrack?.kind === "audio") return senderTrack

	return null
}

function supportsRuntime() {
	return (
		typeof AudioContext !== "undefined" &&
		typeof MediaStream !== "undefined"
	)
}

// fallback for browsers without insertable streams (firefox, safari) and for
// receivers that do not expose the encoded streams api. it measures the decoded
// track with an analyser node and reports speech transitions
const analyserStrategy: SpeakingStrategy = {
	name: "audio-analyser",
	supports(target) {
		return supportsRuntime() && !!getTrack(target)
	},
	attach(target, onChange) {
		const track = getTrack(target)

		if (!track) return null

		const context = getAudioContext()
		const stream = new MediaStream([track])
		const source = context.createMediaStreamSource(stream)
		const analyser = context.createAnalyser()
		// silent sink, analyser nodes need to be part of a rendered graph
		const sink = context.createGain()

		analyser.fftSize = 512
		analyser.smoothingTimeConstant = 0.4

		sink.gain.value = 0

		source.connect(analyser)
		analyser.connect(sink)
		sink.connect(context.destination)

		const buffer = new Float32Array(analyser.fftSize)

		let speaking = false
		let lastVoiceAt = 0
		let stopped = false

		const stop = () => {
			if (stopped) return

			stopped = true

			clearInterval(timer)
			track.removeEventListener("ended", stop)

			try {
				source.disconnect()
			} catch {
				// already disconnected
			}

			try {
				analyser.disconnect()
			} catch {
				// already disconnected
			}

			try {
				sink.disconnect()
			} catch {
				// already disconnected
			}
		}

		const measure = () => {
			if (stopped) return

			analyser.getFloatTimeDomainData(buffer)

			let sum = 0

			for (let i = 0; i < buffer.length; i++) {
				sum += buffer[i] * buffer[i]
			}

			const rms = Math.sqrt(sum / buffer.length)
			const now = Date.now()

			if (rms >= SPEAKING_THRESHOLD) {
				lastVoiceAt = now
			}

			const next = now - lastVoiceAt < SILENCE_HOLD_MS

			if (next !== speaking) {
				speaking = next
				onChange(next)
			}
		}

		const timer = setInterval(measure, TICK_MS)

		// browsers keep the context suspended until a user gesture
		context.resume().catch(() => {})

		track.addEventListener("ended", stop, { once: true })

		return stop
	},
}

export default analyserStrategy
