// @ts-ignore
import { Producer } from "@cores/mediartc/classes/Producers"
import { Client } from "./client"

export interface Channel {
	_id: string
	group_id: string
	kind: "chat" | "voice"

	name: string
	description?: string
	explicit: boolean

	created_at: Date
}

export interface Channels {
	items: Channel[]
	total_items: number
	has_more?: boolean
}

export interface StatedChannel extends Channel {
	clients: Client[]
	producers: Producer[]
	started_at: string | Date | null
}

export interface StatedChannels extends Channels {
	items: StatedChannel[]
}
