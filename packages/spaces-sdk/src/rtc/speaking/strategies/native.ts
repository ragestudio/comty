import type { SpeakingStrategy, SpeakingTarget } from "../types"

import adapter from "@/adapter"

const TRANSFORMER_NAME = "speaking-detector"
const EVENT_NAME = "speakingChanged"

function getTransport(target: SpeakingTarget) {
	return target.role === "sender" ? target.rtpSender : target.rtpReceiver
}

// the native webrtc fork exposes these methods directly on the rtp sender and
// receiver, so we detect them instead of depending on the platform
function isSupported(target: SpeakingTarget) {
	const transport = getTransport(target)

	if (!transport) return false

	if (target.role === "sender") {
		return (
			typeof transport.setEncoderToPacketizerFrameTransformer ===
			"function"
		)
	}

	return (
		typeof transport.setDepacketizerToDecoderFrameTransformer === "function"
	)
}

function setTransformer(target: SpeakingTarget, name: string | null) {
	const transport = getTransport(target)

	if (!transport) return

	if (target.role === "sender") {
		transport.setEncoderToPacketizerFrameTransformer(name)
	} else {
		transport.setDepacketizerToDecoderFrameTransformer(name)
	}
}

// native strategy, it needs the frame transform event bridge registered by the
// host app since the sdk can not import react native webrtc directly
const nativeStrategy: SpeakingStrategy = {
	name: "native-frame-transform",
	supports(target) {
		return !!adapter.frameTransformEvents && isSupported(target)
	},
	attach(target, onChange) {
		const events = adapter.frameTransformEvents
		const transport = getTransport(target)

		if (!events || !transport) return null

		// the native event carries the id of the platform rtp transport, which is
		// not the same as the producer or consumer id used by the sdk
		const transportId = transport.id

		const listener = {}

		events.addListener(listener, EVENT_NAME, (event: any) => {
			if (!event) return
			if (event.id !== transportId) return
			if (event.type !== target.role) return

			onChange(!!event.isSpeaking)
		})

		setTransformer(target, TRANSFORMER_NAME)

		return () => {
			setTransformer(target, null)
			events.removeListener(listener)
		}
	},
}

export default nativeStrategy
