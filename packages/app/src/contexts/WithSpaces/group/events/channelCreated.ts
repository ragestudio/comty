import { EventsUpdaters } from ".."
import { Channel } from "../../collections/channel"

import db from "../../store"

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: Channel,
) => {
	updaters.setChannels((prev) => {
		const nw = { ...prev }

		nw.items.push(payload)

		try {
			db.channels.update(currentGroupId, nw)
		} catch (error) {
			console.error(`Failed to update db cache`, error)
			db.channels.delete(currentGroupId)
		}

		return nw
	})
}
