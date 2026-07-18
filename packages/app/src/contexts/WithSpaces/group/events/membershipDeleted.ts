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

	// update react state
	updaters.setMembers((prev) => {
		return {
			...prev,
			total_items: (prev?.total_items ?? 1) - 1,
			items: (prev?.items ?? []).filter(
				(member) => member.user_id !== payload.user_id,
			),
		}
	})

	// delete from dexie cache
	try {
		db.members.delete(payload.membership_id)
	} catch (err) {
		console.error(`Failed to delete member from cache`, err)
	}
}
