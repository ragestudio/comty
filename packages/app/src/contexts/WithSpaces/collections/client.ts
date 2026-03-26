import { VoiceState } from "./voiceState"

export interface Client {
	userId: string
	voiceState: VoiceState
	user?: any
	self?: boolean
}
