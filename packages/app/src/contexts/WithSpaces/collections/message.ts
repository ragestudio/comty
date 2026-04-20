import { User } from "./user"

export interface Message {
	__v?: number
	cached_at?: number

	user?: User

	_id: string
	channel_id: string
	user_id: string

	message?: string
	attachments?: [Map<string, string>]
	flags?: [string]
	sticker?: string
	reply_to_id?: string

	created_at: Date
	updated_at?: Date
}
