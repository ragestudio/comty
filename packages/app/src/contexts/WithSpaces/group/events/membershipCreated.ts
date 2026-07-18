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

	const newMember = {
		_id: payload.membership_id,
		group_id: payload.group_id,
		user_id: payload.user_id,
		user: payload.user,
	}

	// update react state
	updaters.setMembers((prev) => {
		return {
			...prev,
			total_items: (prev?.total_items ?? 0) + 1,
			items: [...(prev?.items ?? []), newMember],
		}
	})

	// cache to dexie
	try {
		db.members.put(newMember)
	} catch (err) {
		console.error(`Failed to cache new member`, err)
	}
}
