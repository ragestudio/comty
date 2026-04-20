import { EventsUpdaters } from ".."
import db from "../../store"

export interface MemberchipDeletedPayload {
	membership_id: string
	user_id: string
	group_id: string
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: MemberchipDeletedPayload,
) => {
	console.debug("membershipDeleted", payload)

	// update members
	updaters.setMembers((prev) => {
		const nw = { ...prev }

		nw.total_items = nw.total_items - 1

		nw.items = nw.items.filter((member) => {
			if (member.user_id === payload.user_id) {
				return false
			}

			return true
		})

		try {
			db.members.update(payload.group_id, nw)
		} catch (err) {
			console.error(`Failed to update db cache`, err)
			db.members.delete(payload.group_id)
		}

		return nw
	})
}
