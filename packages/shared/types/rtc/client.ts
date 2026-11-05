import type { User } from "../user"
import type { VoiceState } from "./voiceState"

export interface Client {
	channel_id: string
	userId: string
	voiceState: VoiceState
	user?: Partial<User>
	self?: boolean
	// transport ids of the client session, persisted to restore a channel
	transports?: string[]
}
