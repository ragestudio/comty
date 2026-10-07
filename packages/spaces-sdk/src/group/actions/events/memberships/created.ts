import type EventsActions from "../index"
import type { MembershipCreatedPayload } from "@/group/types"
import type { Member } from "@comty/shared/types/spaces/member"

import UserModel from "@comty/api-lib/models/user"
import db from "@/db"

export default async function (
	this: EventsActions,
	payload: MembershipCreatedPayload,
): Promise<void> {
	let user = payload.user

	if (!user) {
		user = await UserModel.data({
			user_id: payload.user_id,
			basic: true,
		})
	}

	const newMember: Member = {
		_id: payload.membership_id,
		group_id: payload.group_id,
		user_id: payload.user_id,
		roles: [],
		user,
	}

	this.setState((state) => ({
		members: {
			...state.members,
			total_items: (state.members?.total_items ?? 0) + 1,
			items: [...(state.members?.items ?? []), newMember],
		},
	}))

	db.members.put(newMember).catch((err) => {
		console.error("Failed to cache new member", err)
	})
}
