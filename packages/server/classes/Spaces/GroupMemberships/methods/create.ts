// @ts-ignore
import { q } from "@ragestudio/scylla-odm/driver/mapping/q"
import type GroupMemberships from "../index"
import Groups from "@shared-classes/Spaces/Groups"

export default async function (
	this: typeof GroupMemberships,
	group_id: string,
	user_id: string,
) {
	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be provided")
	}

	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	// check if is already a member
	if (await this.isUserIdOnMembers(user_id, group_id)) {
		throw new OperationError(400, "User is already a member")
	}

	const _id = global.snowflake.nextId().toString()
	const created_at = new Date()

	const membership = this.model.obj({
		_id: _id,
		user_id: user_id,
		group_id: group_id,
		created_at: created_at,
	})

	await membership.save()

	// update the membership ref
	const groupRef = this.modelRef.obj({
		group_id: group_id,
		user_id: user_id,
		membership_id: membership._id,
		created_at: created_at,
	})

	await groupRef.save()

	// increase the counter
	await this.modelCounter.update({
		group_id: group_id,
		counter: q.incr(1),
	})

	if (global.websockets) {
		const eventPayload = {
			membership_id: membership._id,
			user_id: user_id,
			group_id: group_id,
		}

		if (membership.user_id) {
			try {
				global.websockets.senders.toUserId(
					user_id,
					"groups:membership:created",
					eventPayload,
				)
			} catch (error) {
				console.error(
					"Failed to send (groups:membership:created) to user",
					error,
				)
			}
		}

		try {
			global.websockets.senders.toTopic(
				`group:${group_id}`,
				`group:${group_id}:membership:created`,
				eventPayload,
			)
		} catch (error) {
			console.error(
				"Failed to send (groups:membership:created) to group topic",
				error,
			)
		}
	}

	// send system message to general channel
	Groups.sendSystemMessage(group_id, `@${user_id} joined the group`).catch(
		(error) => {
			console.error("Failed to send join system message:", error)
		},
	)

	return membership.toRaw()
}
