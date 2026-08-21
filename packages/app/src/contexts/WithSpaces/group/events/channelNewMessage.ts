import type { Message } from "../../collections/message"
import type { EventsUpdaters } from ".."

import db from "../../store"

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: Message,
) => {
	console.debug("group channelNewMessage", payload)

	if (payload?.channel_id) {
		db.last_channels_message.put({
			channel_id: payload.channel_id,
			_id: payload._id,
		})

		updaters.setChannels((prevChannels: any) => {
			if (!prevChannels || !prevChannels.items) return prevChannels
			const items = [...prevChannels.items]
			const idx = items.findIndex((c) => c._id === payload.channel_id)

			if (idx !== -1) {
				items[idx] = { ...items[idx], last_message_id: payload._id }
			}

			return { ...prevChannels, items }
		})
	}
}
