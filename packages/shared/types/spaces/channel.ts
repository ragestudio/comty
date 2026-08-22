export interface Channel {
	_id: string
	group_id: string
	kind: "chat" | "voice"

	name: string
	description?: string
	explicit: boolean

	last_message_id?: string

	created_at: Date
	cached_at?: number
}

export interface Channels {
	group_id?: string
	cached_at?: number

	items: Channel[]
	total_items?: number
	has_more?: boolean
}
