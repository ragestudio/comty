import type EventsActions from "../index"
import type { Channels } from "@comty/shared/types/spaces/channel"
import type { Message } from "@comty/shared/types/spaces/message"

import { persistChannelsCache } from "./utils"

export default function (this: EventsActions, payload: Message): void {
	this.setState((state) => {
		const updatedChannels: Channels = {
			...state.channels,
			items: (state.channels?.items ?? []).map((c) => {
				if (c._id === payload.channel_id) {
					return {
						...c,
						last_message: payload,
					}
				}
				return c
			}),
		}

		persistChannelsCache(state.groupId, updatedChannels)

		return { channels: updatedChannels }
	})
}
