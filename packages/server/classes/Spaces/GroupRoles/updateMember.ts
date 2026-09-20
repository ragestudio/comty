import type { Doc } from "@ragestudio/scylla-odm/types"

import type { Group } from "@db/groups"
import type { GroupRole } from "@db/group_roles"
import type { GroupMembership } from "@db/group_memberships"

import GroupMemberships from "../GroupMemberships"
import Groups from "../Groups"

export default async function (payload: {
	group: string | Doc<Group>
	membership: string | Doc<GroupMembership>
	user_id: string
	add: GroupRole["role_key"][]
	remove: GroupRole["role_key"][]
}) {
	let { group, membership, user_id, add, remove } = payload

	// if the group need to be resolved by id, get it
	if (typeof group === "string") {
		group = await Groups.get(group)
	}

	// first get the group
	if (!group) {
		throw new OperationError(404, "Group not found")
	}

	// if the membership need to be resolved by id, get it
	if (typeof membership === "string") {
		// get the membership
		membership = await GroupMemberships.get(group._id, user_id, membership)
	}

	if (!membership) {
		throw new OperationError(404, "Membership not found")
	}

	const rolesSet = new Set(membership.roles ?? [])

	const flattenOperations = []

	add.forEach((role) => {
		flattenOperations.push({ type: "add", role })
	})

	remove.forEach((role) => {
		flattenOperations.push({ type: "remove", role })
	})

	for (const op of flattenOperations) {
		if (op.type === "add") {
			rolesSet.add(op.role)
		}

		if (op.type === "remove") {
			rolesSet.delete(op.role)
		}
	}

	// overwrite the roles with the updated set
	membership.roles = Array.from(rolesSet)

	// save the membership
	await membership.save()

	return membership
}
