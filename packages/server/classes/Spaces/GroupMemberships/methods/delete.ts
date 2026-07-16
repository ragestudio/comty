import Groups from "@shared-classes/Spaces/Groups"

import { q } from "@ragestudio/scylla-odm/driver/mapping/q"
import type GroupMemberships from "../index"
import type { Group } from "@db/groups"

export default async function (
	this: typeof GroupMemberships,
	user_id: string,
	membership_id: string,
	group_id: string,
	group?: Group,
) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}
	if (typeof membership_id !== "string") {
		throw new OperationError(400, "membership_id must be a string")
	}
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	if (!group) {
		group = await Groups.model.findOne({
			_id: group_id,
		})
	}

	if (!group) {
		throw new OperationError(404, "Group not found")
	}

	let membership = await this.model.findOne({
		user_id: user_id,
		group_id: group_id,
		_id: membership_id,
	})

	if (!membership) {
		throw new OperationError(404, "Membership not exist for this group")
	}

	await membership.delete()

	await this.modelRef.delete({
		group_id: group_id,
		membership_id: membership._id,
		created_at: membership.created_at,
	})

	// decrease the counter
	await this.modelCounter.update({
		group_id: group_id,
		counter: q.decr(1),
	})

	if (global.websockets) {
		const eventPayload = {
			membership_id: membership._id,
			user_id: membership.user_id,
			group_id: group_id,
		}

		if (membership.user_id) {
			try {
				global.websockets.senders.toUserId(
					membership.user_id,
					"groups:membership:deleted",
					eventPayload,
				)
			} catch (error) {
				console.error(
					"Failed to send (groups:membership:deleted) to user",
					error,
				)
			}
		}

		try {
			global.websockets.senders.toTopic(
				`group:${group_id}`,
				`group:${group_id}:membership:deleted`,
				eventPayload,
			)
		} catch (error) {
			console.error(
				"Failed to send (groups:membership:deleted) to group topic",
				error,
			)
		}
	}

	return membership
}
