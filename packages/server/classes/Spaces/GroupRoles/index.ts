import GroupRolesModel from "@db/group_roles"

import updateMember from "./updateMember"
import createMethod from "./methods/create"
import updateMethod from "./methods/update"
import deleteMethod from "./methods/delete"
import orderMethod from "./methods/order"
import getMethod from "./methods/get"
import {
	createDefaultMemberRole,
	formatRoleLabel,
	normalizeRole,
} from "./helpers"

export type { CreateRolePayload, CreateRoleOptions } from "./methods/create"
export type { UpdateRolePayload, UpdateRoleOptions } from "./methods/update"

export default class GroupRoles {
	static get model() {
		return GroupRolesModel
	}

	static async getByGroupId(group_id: string) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const storedRoles = (await GroupRolesModel.find(
			{
				group_id: group_id,
			},
			{
				raw: true,
			},
		)) as any[]

		const roles = storedRoles.map(normalizeRole)

		// the default role always exists, it can be overridden by a stored row
		const storedMemberRole = roles.find((role) => role.role_key === "member")

		if (storedMemberRole) {
			storedMemberRole.is_default = true
			storedMemberRole.position = 0
		} else {
			roles.push(createDefaultMemberRole(group_id))
		}

		return roles.sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
	}

	static get = getMethod
	static create = createMethod
	static update = updateMethod
	static delete = deleteMethod
	static order = orderMethod

	static updateMember = updateMember

	// kept for backwards compatibility with older call sites
	static formatRoleLabel = formatRoleLabel
}
