import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default async function (user_id, group_id) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	if (typeof group_id !== "string") {
		throw new OperationError(400, "group_id must be a string")
	}

	// lookup for the group
	const group = await this.get(group_id, {
		basic: false,
	})

	if (!group) {
		throw new OperationError(404, "Group not found")
	}

	// check if group is public
	if (group.reachability === "public") {
		return group
	}

	// check if the user is the owner or is in the memberships
	const isMember = await GroupMemberships.isUserIdOnMembers(user_id, group_id)

	if (!isMember) {
		throw new OperationError(403, "You are not a member of this group")
	}

	return group
}
