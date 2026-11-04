import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupRoles from "@shared-classes/Spaces/GroupRoles"
import User from "@db_models/user"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { member_id } = req.params

		const authz = await Gatekeeper.fromRequest(req)

		authz.require("READ_MEMBERSHIPS")

		const membership = await GroupMemberships.getOneById(
			authz.group._id,
			member_id,
		)

		if (!membership) {
			throw new OperationError(404, "Membership not found")
		}

		const member = membership.toRaw()

		const roles = await GroupRoles.getByGroupId(authz.group._id)
		const rolesByKey = new Map(roles.map((role) => [role.role_key, role]))

		const roleKeys = new Set(Array.isArray(member.roles) ? member.roles : [])

		const resolvedRoles = []

		if (member.user_id === authz.group.owner_user_id) {
			resolvedRoles.push({
				_id: "owner",
				label: "Owner",
				color: "orange",
			})
		}

		for (const roleKey of roleKeys) {
			if (roleKey === "member") continue

			const role = rolesByKey.get(roleKey)

			resolvedRoles.push({
				_id: roleKey,
				label: role?.label ?? roleKey,
				color: role?.color,
			})
		}

		resolvedRoles.push({
			_id: "member",
			label: "Member",
		})

		member.roles = resolvedRoles

		try {
			const user = await User.findById(member.user_id).lean()

			if (user) {
				member.user = {
					user_id: String(user._id),
					...user,
				}
			}
		} catch {
			// invalid user id, leave the member without profile
		}

		return member
	},
}
