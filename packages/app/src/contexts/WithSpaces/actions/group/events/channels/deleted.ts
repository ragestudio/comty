import type EventsActions from "../index"
import type { Channel, Channels } from "@comty/shared/types/spaces/channel"

import { persistChannelsCache } from "./utils"
import db from "../../../../db"

export default function (this: EventsActions, payload: Channel): void {
	this.setState((state) => {
		const updatedChannels: Channels = {
			...state.channels,
			total_items: Math.max((state.channels?.total_items ?? 1) - 1, 0),
			items: (state.channels?.items ?? []).filter(
				(c) => c._id !== payload._id,
			),
		}

		persistChannelsCache(state.groupId, updatedChannels)

		db.channel_messages
			.where("channel_id")
			.equals(payload._id)
			.delete()
			.catch((err) => {
				console.error("Failed to delete channel messages", err)
			})

		return { channels: updatedChannels }
	})
}
