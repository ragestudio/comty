import type { StatedChannels } from "./channel"
import type { Members } from "./member"

export interface Group {
	_id: string
	owner_user_id: string

	name: string
	description: string

	icon?: string
	cover?: string
	groupCoverImageAverageColor?: string

	channels: StatedChannels
	members: Members

	connected_members?: string[]
}
