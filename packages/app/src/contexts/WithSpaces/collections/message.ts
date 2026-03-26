export interface Message {
	_id: string
	channel_id: string
	user_id: string

	message?: string
	attachments?: [Map<string, string>]
	flags?: [string]
	sticker?: string
	reply_to_id?: string

	updated_at: Date
	created_at: Date

	cached_at?: number
}
