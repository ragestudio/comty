import { EventsUpdaters } from ".."
import db from "../../store"

export interface MemberchipCreatedPayload {
	membership_id: string
	user_id: string
	group_id: string
	created_at: string
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: MemberchipCreatedPayload,
) => {
	// exclude yourself
	if (payload.user_id === app.userData._id) {
		return null
	}
	// exclude not current group_id
	// (this should not happend, cause those type of events its topic only, but never knows)
	if (payload.group_id !== currentGroupId) {
		return null
	}

	// update members
	updaters.setMembers((prev) => {
		const nw = { ...prev }

		nw.total_items = nw.total_items + 1

		nw.items.push({
			_id: payload.membership_id,
			group_id: payload.group_id,
			user_id: payload.user_id,
			created_at: payload.created_at,
		})

		try {
			db.members.update(payload.group_id, nw)
		} catch (err) {
			console.error(`Failed to update db cache`, err)
			db.members.delete(payload.group_id)
		}

		return nw
	})

	// update db

	return null
}
