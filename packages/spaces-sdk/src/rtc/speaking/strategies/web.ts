import type {
	SpeakingChangeHandler,
	SpeakingStrategy,
	SpeakingTarget,
} from "../types"

import workerSource from "../../workers/rtp-spkdt"

const handlers = new Map<string, SpeakingChangeHandler>()

let worker: Worker | null = null

function keyOf(target: SpeakingTarget) {
	return target.role + ":" + target.id
}

function getTransport(target: SpeakingTarget) {
	return target.role === "sender" ? target.rtpSender : target.rtpReceiver
}

// the worker is shared between all targets, messages carry the target id and
// role so we can route them to the right handler
function getWorker(): Worker | null {
	if (worker) return worker

	// react native has no worker implementation, so this strategy is web only
	if (typeof Worker === "undefined" || typeof URL === "undefined") {
		return null
	}

	if (typeof URL.createObjectURL !== "function") {
		return null
	}

	const blob = new Blob([workerSource], { type: "application/javascript" })
	const url = URL.createObjectURL(blob)

	worker = new Worker(url)

	worker.onmessage = (event: MessageEvent) => {
		const { id, type, isSpeaking } = event.data ?? {}

		handlers.get(type + ":" + id)?.(!!isSpeaking)
	}

	return worker
}

// web strategy based on the insertable streams api, it reads the encoded
// frames of the target and reports speaking changes
const webStrategy: SpeakingStrategy = {
	name: "insertable-streams",
	supports(target) {
		const transport = getTransport(target)

		return (
			typeof transport?.createEncodedStreams === "function" &&
			typeof Worker !== "undefined"
		)
	},
	attach(target, onChange) {
		const transport = getTransport(target)
		const instance = getWorker()

		if (!transport || !instance) return null

		const streams = transport.createEncodedStreams()

		handlers.set(keyOf(target), onChange)

		instance.postMessage(
			{
				id: target.id,
				type: target.role,
				readableStream: streams.readable,
				writableStream: streams.writable,
			},
			[streams.readable, streams.writable],
		)

		return () => {
			handlers.delete(keyOf(target))
		}
	},
}

export default webStrategy
