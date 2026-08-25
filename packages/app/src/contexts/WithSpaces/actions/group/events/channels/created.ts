import type EventsActions from "../index"
import type { Channel, Channels } from "@comty/shared/types/spaces/channel"

import { persistChannelsCache } from "./utils"

export default function (this: EventsActions, payload: Channel): void {
	this.setState((state) => {
		const updatedChannels: Channels = {
			...state.channels,
			total_items: (state.channels?.total_items ?? 0) + 1,
			items: [...(state.channels?.items ?? []), payload],
		}

		persistChannelsCache(state.groupId, updatedChannels)

		return { channels: updatedChannels }
	})
}
