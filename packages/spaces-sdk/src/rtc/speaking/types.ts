export type SpeakingRole = "sender" | "receiver"

// a target is any encoded media endpoint, either a rtp sender for our own
// audio or a rtp receiver for a remote one
export interface SpeakingTarget {
	id: string
	role: SpeakingRole
	rtpSender?: any
	rtpReceiver?: any
}

export type SpeakingChangeHandler = (isSpeaking: boolean) => void

// a strategy knows how to read encoded audio frames from a target for one
// specific runtime, the sdk picks the first supported one
export interface SpeakingStrategy {
	name: string
	supports(target: SpeakingTarget): boolean
	attach(
		target: SpeakingTarget,
		onChange: SpeakingChangeHandler,
	): (() => void) | null
}
