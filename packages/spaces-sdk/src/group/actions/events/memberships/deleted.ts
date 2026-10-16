import type EventsActions from "../index"
import type { MembershipDeletedPayload } from "@/group/types"

import db from "@/db"
import logger from "@/utils/logger"

export default function (
	this: EventsActions,
	payload: MembershipDeletedPayload,
): void {
	this.setState((state) => ({
		members: {
			...state.members,
			total_items: Math.max((state.members?.total_items ?? 1) - 1, 0),
			items: (state.members?.items ?? []).filter(
				(m) => m.user_id !== payload.user_id,
			),
		},
	}))

	db.members.delete(payload.membership_id).catch((err) => {
		logger.error("Failed to delete member from cache", err)
	})
}
