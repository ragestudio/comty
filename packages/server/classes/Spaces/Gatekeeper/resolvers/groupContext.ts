import type { Doc } from "@ragestudio/scylla-odm/types"
import type { Group } from "@db/groups"

import GroupMemberships from "../../GroupMemberships"
import GroupRoles from "../../GroupRoles"
import AuthorizationContext from "../AuthorizationContext"

export default async function (
	group: Doc<Group>,
	userId: string,
): Promise<AuthorizationContext> {
	if (!group || typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof userId !== "string") {
		throw new OperationError(400, "user_id must be a string")
	}

	// both queries hit a single partition and are resolved once per request
	const [membership, roles] = await Promise.all([
		GroupMemberships.getOneByUserId(group._id, userId),
		GroupRoles.getByGroupId(group._id),
	])

	return new AuthorizationContext(group, membership ?? null, roles, userId)
}
