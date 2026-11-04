import type { Doc } from "@ragestudio/scylla-odm/types"
import type { Group } from "@db/groups"
import type Groups from "../index"

import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default async function (
	this: typeof Groups,
	group: Doc<Group>,
	current_owner_user_id: string,
	new_owner_user_id: string,
): Promise<Doc<Group>> {
	if (typeof current_owner_user_id !== "string") {
		throw new OperationError(400, "current_owner_user_id must be a string")
	}

	if (typeof new_owner_user_id !== "string") {
		throw new OperationError(400, "new_owner_user_id must be a string")
	}

	if (group.owner_user_id !== current_owner_user_id) {
		throw new OperationError(403, "Only the group owner can transfer it")
	}

	if (current_owner_user_id === new_owner_user_id) {
		throw new OperationError(400, "You are already the owner of this group")
	}

	const targetMembership = await GroupMemberships.getOneByUserId(
		group._id,
		new_owner_user_id,
	)

	if (!targetMembership) {
		throw new OperationError(404, "The target user is not a member")
	}

	group.owner_user_id = new_owner_user_id
	group.__v = (group.__v ?? 0) + 1

	await group.save()

	// keep the previous owner with an explicit admin role
	const previousOwnerMembership = await GroupMemberships.getOneByUserId(
		group._id,
		current_owner_user_id,
	)

	if (previousOwnerMembership) {
		const roles = new Set(
			Array.isArray(previousOwnerMembership.roles)
				? previousOwnerMembership.roles
				: [],
		)

		roles.add("admin")

		previousOwnerMembership.roles = Array.from(roles)

		await previousOwnerMembership.save()
	}

	if (global.websockets) {
		try {
			global.websockets.senders.toTopic(
				`group:${group._id}`,
				`group:${group._id}:update`,
				group.toRaw(),
			)
		} catch (error) {
			console.error("Failed to send group update", error)
		}
	}

	return group
}
