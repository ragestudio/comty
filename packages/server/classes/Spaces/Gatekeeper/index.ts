import type { Doc } from "@ragestudio/scylla-odm/types"
import type { Group } from "@db/groups"
import type { GroupPermission } from "@comty/shared/types/spaces/permissions"

import Groups from "../Groups"
import AuthorizationContext from "./AuthorizationContext"
import resolveGroupContext from "./resolvers/groupContext"
import { GROUP_ACTIONS } from "./actions"

const requestContexts = new WeakMap<
	object,
	Map<string, Promise<AuthorizationContext>>
>()

export default class Gatekeeper {
	static actions = GROUP_ACTIONS

	/**
	 * Resolve every permission for an user in a group.
	 */
	static async forGroup(
		groupOrId: string | Doc<Group>,
		userId: string,
	): Promise<AuthorizationContext> {
		const group =
			typeof groupOrId === "string"
				? await Groups.get(groupOrId, { raw: false })
				: groupOrId

		return await resolveGroupContext(group, userId)
	}

	/**
	 * Resolve the context once per request and group. Handlers can call this
	 * multiple times without extra queries.
	 */
	static async fromRequest(
		req: any,
		param = "group_id",
	): Promise<AuthorizationContext> {
		const groupId = req?.params?.[param]

		if (typeof groupId !== "string") {
			throw new OperationError(400, `${param} must be a string`)
		}

		const userId = req?.auth?.user_id ?? req?.auth?.session?.user_id

		if (typeof userId !== "string") {
			throw new OperationError(401, "Authentication required")
		}

		let contexts = requestContexts.get(req)

		if (!contexts) {
			contexts = new Map()
			requestContexts.set(req, contexts)
		}

		const cached = contexts.get(groupId)

		if (cached) {
			return await cached
		}

		// cache the promise to deduplicate concurrent checks
		const pending = Gatekeeper.forGroup(groupId, userId)
		contexts.set(groupId, pending)

		return await pending
	}

	static async canPerform(
		userId: string,
		group: string | Doc<Group>,
		permission: GroupPermission,
	): Promise<boolean> {
		const authz = await Gatekeeper.forGroup(group, userId)

		return authz.can(permission)
	}
}

export { AuthorizationContext }
export { AuthorizationError } from "./errors"
export { GROUP_ACTIONS } from "./actions"
