import { VoiceState } from "./voiceState"

export interface Client {
	channel_id: string
	userId: string
	voiceState: VoiceState
	user?: any
	self?: boolean
}
