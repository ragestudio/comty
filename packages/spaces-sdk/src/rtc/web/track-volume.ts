import { dbToGain, getAudioContext, keepContextRunning } from "./audio-context"
import { sysAudio } from "./sys-audio"
import loggerBase from "@/utils/logger"

const logger = loggerBase.child("track-volume")

// a gain node per remote track. connecting the node to an output destination is
// what actually plays the track. on electron the destination is the sysaudio
// output bus (avoids feedback while capturing the system loopback)
interface PlaybackGraph {
	stream: MediaStream
	source: MediaStreamAudioSourceNode
	gain: GainNode
	context: AudioContext
	destination: AudioNode
	baseGain: number
	// muted element used to keep the remote track inside the media pipeline
	anchor: HTMLAudioElement | null
}

const graphs = new Map<MediaStreamTrack, PlaybackGraph>()

let outputGainDb = 0

function resolveTarget(): {
	context: AudioContext
	destination: AudioNode
} {
	const systemTarget = sysAudio.outputTarget()

	if (systemTarget) return systemTarget

	const context = getAudioContext()

	return { context, destination: context.destination }
}

function applyGain(graph: PlaybackGraph) {
	graph.gain.gain.value = graph.baseGain * dbToGain(outputGainDb)
}

// some browsers do not decode a remote track until it is attached to a media
// element, so keep a muted element pointing at the same stream. the audible
// output still comes from the audio graph
function anchorStream(stream: MediaStream): HTMLAudioElement | null {
	if (typeof Audio === "undefined") return null

	try {
		const element = new Audio()

		element.muted = true
		element.autoplay = true
		element.srcObject = stream

		element.play().catch(() => {})

		return element
	} catch {
		return null
	}
}

export function setTrackVolume(track: MediaStreamTrack, gain: number): void {
	let graph = graphs.get(track)

	if (!graph) {
		const target = resolveTarget()
		const stream = new MediaStream([track])
		const source = target.context.createMediaStreamSource(stream)
		const node = target.context.createGain()

		source.connect(node)
		node.connect(target.destination)

		graph = {
			stream,
			source,
			gain: node,
			context: target.context,
			destination: target.destination,
			baseGain: gain,
			anchor: anchorStream(stream),
		}

		graphs.set(track, graph)

		track.addEventListener("ended", () => disposeTrack(track), {
			once: true,
		})

		logger.debug("playback graph ready", {
			trackId: track.id,
			muted: track.muted,
			readyState: track.readyState,
			contextState: target.context.state,
		})

		// do not allow a suspended context to leave the remote audio silent
		keepContextRunning(target.context)

		if (target.context.state === "suspended") {
			target.context.resume().catch(() => {})
		}
	}

	graph.baseGain = gain
	applyGain(graph)
}

// global output gain coming from the audio processing settings
export function setOutputGainDb(db: number): void {
	outputGainDb = db

	for (const graph of graphs.values()) {
		applyGain(graph)
	}
}

// re-creates every graph, used when the output target changes (sysaudio output
// becomes available or goes away)
export function rebuildAllTracks(): void {
	const entries = Array.from(graphs.entries())

	for (const [track, graph] of entries) {
		disposeTrack(track)
		setTrackVolume(track, graph.baseGain)
	}
}

function disposeTrack(track: MediaStreamTrack) {
	const graph = graphs.get(track)

	if (!graph) return

	try {
		graph.source.disconnect()
	} catch {
		// already disconnected
	}

	try {
		graph.gain.disconnect()
	} catch {
		// already disconnected
	}

	if (graph.anchor) {
		graph.anchor.pause()
		graph.anchor.srcObject = null
	}

	graphs.delete(track)
}

export function disposeAllTracks(): void {
	for (const track of Array.from(graphs.keys())) {
		disposeTrack(track)
	}
}
