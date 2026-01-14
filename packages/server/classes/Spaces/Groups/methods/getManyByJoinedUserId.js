import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default async function (user_id) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	const memberships = await GroupMemberships.getByUserId(user_id)

	if (memberships.length === 0) {
		return []
	}

	const groups = await this.getMany(
		memberships.map((membership) => membership.group_id),
	)

	return groups
}
