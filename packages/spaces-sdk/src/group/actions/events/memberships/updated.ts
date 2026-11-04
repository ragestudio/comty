import type EventsActions from "../index"
import type { MembershipUpdatedPayload } from "@/group/types"

import session from "comty.js/core/session"

import db from "@/db"
import logger from "@comty/shared/utils/logger"

export default function (
	this: EventsActions,
	payload: MembershipUpdatedPayload,
): void {
	if (!payload?.membership_id) return

	this.setState((state) => ({
		members: {
			...state.members,
			items: state.members.items.map((member) =>
				member._id === payload.membership_id
					? {
							...member,
							roles: payload.roles ?? member.roles,
						}
					: member,
			),
		},
	}))

	db.members
		.get(payload.membership_id)
		.then((member) => {
			if (!member) return

			return db.members.put({
				...member,
				roles: payload.roles ?? member.roles,
				cached_at: Date.now(),
			})
		})
		.catch((err) => {
			logger.error("Failed to update cached member roles", err)
		})

	// only the affected user permissions changed
	if (!session.user_id || session.user_id === payload.user_id) {
		this.state.actions.fetchViewerPermissions()
	}
}
