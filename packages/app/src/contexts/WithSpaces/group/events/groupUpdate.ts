import { EventsUpdaters } from ".."
import db from "../../store"

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: any,
): void => {
	console.debug("Group data updated", payload)

	updaters.setData(() => {
		try {
			db.groups.update(payload._id, payload)
		} catch (err) {
			console.error(`Failed to update db cache`, err)
			db.groups.delete(payload._id)
		}

		return payload
	})
}
