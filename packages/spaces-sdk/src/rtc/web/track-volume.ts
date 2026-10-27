import { dbToGain, getAudioContext } from "./audio-context"
import { sysAudio } from "./sys-audio"

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

function resumeContext(context: AudioContext) {
	if (context.state === "suspended") {
		context.resume().catch(() => {})
	}
}

function applyGain(graph: PlaybackGraph) {
	graph.gain.gain.value = graph.baseGain * dbToGain(outputGainDb)
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
		}

		graphs.set(track, graph)

		track.addEventListener("ended", () => disposeTrack(track), {
			once: true,
		})

		resumeContext(target.context)
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

	graphs.delete(track)
}

export function disposeAllTracks(): void {
	for (const track of Array.from(graphs.keys())) {
		disposeTrack(track)
	}
}
