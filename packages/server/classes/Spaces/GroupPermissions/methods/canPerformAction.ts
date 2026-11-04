import type { GroupPermission } from "@comty/shared/types/spaces/permissions"
import type GroupPermissions from "../index"

import Gatekeeper from "../../Gatekeeper"

export default async function (
	this: typeof GroupPermissions,
	user_id: string,
	group: any,
	action: keyof typeof GroupPermissions.enum,
) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be provided")
	}

	if (typeof group !== "object" || !group) {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof action !== "string") {
		throw new OperationError(400, "action must be provided")
	}

	// check if action exist in the enum
	if (typeof this.enum[action] === "undefined") {
		throw new OperationError(400, "Invalid action")
	}

	const authz = await Gatekeeper.forGroup(group, user_id)

	return authz.can(action as GroupPermission)
}
