import type EventsActions from "../index"
import type { Channel, Channels } from "@comty/shared/types/spaces/channel"

import { persistChannelsCache } from "./utils"

export default function (this: EventsActions, payload: string[]): void {
	this.setState((state) => {
		const channelMap = new Map(
			(state.channels?.items ?? []).map((c) => [c._id, c]),
		)

		const orderedItems = payload
			.map((id) => channelMap.get(id))
			.filter(Boolean) as Channel[]

		const unorderedItems = (state.channels?.items ?? []).filter(
			(c) => !payload.includes(c._id),
		)

		const updatedChannels: Channels = {
			...state.channels,
			items: [...orderedItems, ...unorderedItems],
		}

		persistChannelsCache(state.groupId, updatedChannels)

		return { channels: updatedChannels }
	})
}
