import type { SetGroupState, GetGroupState } from "./context"
import type {
	MembershipCreatedPayload,
	MembershipDeletedPayload,
} from "../types"

import UserModel from "@models/user"
import db from "../../../store"

export const createMembershipEvents = (
	set: SetGroupState,
	get: GetGroupState,
) => ({
	handleMembershipCreated: async (payload: MembershipCreatedPayload) => {
		let user = payload.user

		if (!user) {
			user = await UserModel.data({
				user_id: payload.user_id,
				basic: true,
			})
		}

		const newMember = {
			_id: payload.membership_id,
			group_id: payload.group_id,
			user_id: payload.user_id,
			user,
		}

		set((state) => ({
			members: {
				...state.members,
				total_items: (state.members?.total_items ?? 0) + 1,
				items: [...(state.members?.items ?? []), newMember],
			},
		}))

		db.members.put(newMember).catch((err) => {
			console.error("Failed to cache new member", err)
		})
	},

	handleMembershipDeleted: (payload: MembershipDeletedPayload) => {
		set((state) => ({
			members: {
				...state.members,
				total_items: Math.max((state.members?.total_items ?? 1) - 1, 0),
				items: (state.members?.items ?? []).filter(
					(m) => m.user_id !== payload.user_id,
				),
			},
		}))

		db.members.delete(payload.membership_id).catch((err) => {
			console.error("Failed to delete member from cache", err)
		})
	},
})
