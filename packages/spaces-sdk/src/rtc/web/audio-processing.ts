import type {
	AudioProcessingAdapter,
	AudioProcessingConfig,
} from "@/rtc/audio/processing"
import { DEFAULT_AUDIO_PROCESSING_CONFIG } from "@/rtc/audio/processing"

const volumeGateWorkletUrl = new URL(
	"./worklets/volume-gate.js",
	import.meta.url,
).href
import rnnoiseWorkletUrl from "@timephy/rnnoise-wasm/NoiseSuppressorWorklet?worker&url"

import { dbToGain, getAudioContext, resumeAudioContext } from "./audio-context"
import { getSelectedInputDeviceId } from "./audio-devices"
import { setOutputGainDb } from "./track-volume"

// a processing chain for one captured mic stream. the returned stream is the
// destination node output, the raw track is kept to switch input devices later
interface MicChain {
	source: MediaStreamAudioSourceNode
	inputGain: GainNode
	rnnoise: AudioWorkletNode
	gate: AudioWorkletNode
	destination: MediaStreamAudioDestinationNode
	rawTrack: MediaStreamTrack
}

const chains = new Map<MediaStream, MicChain>()

let modulesLoaded = false

function cloneConfig(source: AudioProcessingConfig): AudioProcessingConfig {
	return {
		input: { ...source.input },
		output: { ...source.output },
	}
}

let config = cloneConfig(DEFAULT_AUDIO_PROCESSING_CONFIG)

async function ensureModules(ctx: AudioContext) {
	if (modulesLoaded) return

	await ctx.audioWorklet.addModule(volumeGateWorkletUrl)
	await ctx.audioWorklet.addModule(rnnoiseWorkletUrl)

	modulesLoaded = true
}

function disconnectNode(node: AudioNode) {
	try {
		node.disconnect()
	} catch {
		// node was not connected
	}
}

// reconnects the chain following the current config, so changing rnnoise or
// the gate while in a call does not require re-acquiring the mic
function connectChain(chain: MicChain) {
	const ctx = getAudioContext()

	disconnectNode(chain.source)
	disconnectNode(chain.inputGain)
	disconnectNode(chain.rnnoise)
	disconnectNode(chain.gate)

	chain.inputGain.gain.value =
		config.input.gainMode === "manual" ? dbToGain(config.input.gainDb) : 1

	chain.gate.parameters
		.get("threshold")
		?.setValueAtTime(config.input.gateThresholdDb, ctx.currentTime)

	chain.source.connect(chain.inputGain)

	let last: AudioNode = chain.inputGain

	if (config.input.noiseSuppression === "rnnoise") {
		last.connect(chain.rnnoise)
		last = chain.rnnoise
	}

	if (config.input.gateEnabled) {
		last.connect(chain.gate)
		last = chain.gate
	}

	last.connect(chain.destination)
}

export async function processMicStream(
	stream: MediaStream,
): Promise<MediaStream> {
	const rawTrack = stream.getAudioTracks()[0]

	if (!rawTrack) return stream

	const ctx = getAudioContext()

	await ensureModules(ctx)
	await resumeAudioContext()

	const source = ctx.createMediaStreamSource(stream)
	const inputGain = ctx.createGain()
	const destination = new MediaStreamAudioDestinationNode(ctx, {
		channelCount: 1,
	})

	const rnnoise = new AudioWorkletNode(ctx, "NoiseSuppressorWorklet")
	const gate = new AudioWorkletNode(ctx, "volume-gate", {
		parameterData: {
			threshold: config.input.gateThresholdDb,
			attack: 0.03,
			release: 0.01,
		},
	})

	const chain: MicChain = {
		source,
		inputGain,
		rnnoise,
		gate,
		destination,
		rawTrack,
	}

	const processedStream = destination.stream

	chains.set(processedStream, chain)
	connectChain(chain)

	rawTrack.addEventListener("ended", () => disposeChain(chain), {
		once: true,
	})

	return processedStream
}

function disposeChain(chain: MicChain) {
	const processedStream = chain.destination.stream

	// already released by the stream owner
	if (chains.get(processedStream) !== chain) return

	chains.delete(processedStream)

	disconnectNode(chain.source)
	disconnectNode(chain.inputGain)
	disconnectNode(chain.rnnoise)
	disconnectNode(chain.gate)

	// the processed stream does not own the raw capture, stopping it here is
	// what actually releases the microphone
	chain.rawTrack.stop()
}

// releases the processing chain and the raw microphone capture behind the
// stream returned by processMicStream
export function releaseMicStream(stream: MediaStream) {
	const chain = chains.get(stream)

	if (chain) disposeChain(chain)
}

export function getActiveMicTrack(): MediaStreamTrack | null {
	for (const chain of chains.values()) {
		return chain.rawTrack
	}

	return null
}

export const webAudioProcessing: AudioProcessingAdapter = {
	capabilities: {
		noiseSuppression: ["off", "system", "rnnoise"],
		gate: true,
		manualGain: true,
		autoGain: true,
		echoCancellation: true,
		outputGain: true,
	},
	async apply(next) {
		config = cloneConfig(next)

		setOutputGainDb(config.output.gainDb)

		const browserNoiseSuppression =
			config.input.noiseSuppression === "system"

		for (const chain of chains.values()) {
			connectChain(chain)

			// keep the browser constraints aligned with the processing config
			chain.rawTrack
				.applyConstraints({
					noiseSuppression: browserNoiseSuppression,
					autoGainControl: config.input.gainMode === "auto",
					echoCancellation: config.input.echoCancellation,
				})
				.catch(() => {})
		}
	},
	getMicrophoneConstraints() {
		// rnnoise replaces the browser suppressor, so it is only enabled in
		// system mode. auto gain and echo cancellation are handled by the
		// browser constraints, the worklet chain only applies manual gain
		const inputDeviceId = getSelectedInputDeviceId()

		return {
			noiseSuppression: config.input.noiseSuppression === "system",
			autoGainControl: config.input.gainMode === "auto",
			echoCancellation: config.input.echoCancellation,
			...(inputDeviceId ? { deviceId: { ideal: inputDeviceId } } : {}),
		}
	},
}

export function getProcessingConfig(): AudioProcessingConfig {
	return config
}
