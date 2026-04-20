import { EventsUpdaters } from ".."
import { Message } from "../../collections/message"

import db from "../../store"

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: Message,
) => {
	console.debug("group channelDeletedMessage", payload)
}
