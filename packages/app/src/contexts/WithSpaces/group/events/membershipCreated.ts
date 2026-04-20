import { EventsUpdaters } from ".."
import db from "../../store"
import UserModel from "@models/user"

export interface MemberchipCreatedPayload {
	group_id: string
	membership_id: string
	user_id: string
	user?: any
}

export default async (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: MemberchipCreatedPayload,
) => {
	console.debug("membershipCreated", payload)

	if (!payload.user) {
		payload.user = await UserModel.data({
			user_id: payload.user_id,
			basic: true,
		})
	}

	// update members
	updaters.setMembers((prev) => {
		const nw = { ...prev }

		nw.total_items = nw.total_items + 1

		nw.items.push({
			_id: payload.membership_id,
			group_id: payload.group_id,
			user_id: payload.user_id,
			user: payload.user,
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
