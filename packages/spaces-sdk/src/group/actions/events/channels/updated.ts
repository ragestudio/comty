import type EventsActions from "../index"
import type { Channel, Channels } from "@comty/shared/types/spaces/channel"

import { persistChannelsCache } from "./utils"

export default function (this: EventsActions, payload: Channel): void {
	this.setState((state) => {
		const updatedChannels: Channels = {
			...state.channels,
			items: (state.channels?.items ?? []).map((c) =>
				c._id === payload._id ? { ...c, ...payload } : c,
			),
		}

		persistChannelsCache(state.groupId, updatedChannels)

		return { channels: updatedChannels }
	})
}
