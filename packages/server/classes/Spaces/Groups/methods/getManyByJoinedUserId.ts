import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import type Groups from "../index"

export default async function (this: typeof Groups, user_id: string) {
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
