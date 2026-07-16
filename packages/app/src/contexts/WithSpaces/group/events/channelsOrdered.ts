import { EventsUpdaters } from ".."
import { Channel } from "../../collections/channel"
import db from "../../store"

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: string[],
) => {
	if (!Array.isArray(payload)) {
		return null
	}

	updaters.setChannels((prev) => {
		const nw = { ...prev }

		nw.items = nw.items.sort((a, b) => {
			return payload.indexOf(a._id) - payload.indexOf(b._id)
		})

		try {
			db.channels.update(currentGroupId, nw)
		} catch (error) {
			console.error(`Failed to update db cache`, error)
			db.channels.delete(currentGroupId)
		}

		return nw
	})
}
