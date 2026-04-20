import { Channel, StatedChannel } from "./collections/channel"
import { Group } from "./collections/group"
import { Member } from "./collections/member"

type T_UseChatMessagesArgs = {
	type: string
	config: any
	params: any
	events: any
	channel?: any
}

type LastChannelsMessages = {
	channel_id: string
	_id: string
}

type GroupState = {
	group: Group

	total_members: number
	memberships: Member[]

	last_channels_messages: LastChannelsMessages[]
	rtc: StatedChannel[]
	channels: Channel[]
	connected_members: string[]
}

export type DeleteMessagePayload = {
	_id: string // the message id
}

export type LoadMessagesParams = {
	beforeId?: string
	afterId?: string
	limit?: number
}
