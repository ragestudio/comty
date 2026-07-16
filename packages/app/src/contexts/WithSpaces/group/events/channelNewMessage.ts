import { EventsUpdaters } from ".."
import { Message } from "../../collections/message"

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
	}
}
