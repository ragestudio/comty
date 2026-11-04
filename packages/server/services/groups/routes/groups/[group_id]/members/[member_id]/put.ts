import type API from "@services/groups/groups.service"

import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupRoles from "@shared-classes/Spaces/GroupRoles"
import { resolveMemberRoles } from "@shared-classes/Spaces/GroupRoles/helpers"

export type MemberPutPayload = {
	add_roles?: string[]
	remove_roles?: string[]
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["scylla"] as const,
	fn: async (req) => {
		const { member_id } = req.params as {
			group_id: string
			member_id: string
		}
		const payload = (req.body ?? {}) as MemberPutPayload

		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_ROLES")

		let member = await GroupMemberships.getOneById(authz.group._id, member_id)

		if (!member) {
			throw new OperationError(404, "Member not found")
		}

		const isSelf = member.user_id === authz.userId

		// the owner can always manage their own roles
		if (
			!(isSelf && authz.isOwner) &&
			!authz.canActOn({
				user_id: member.user_id,
				roles: member.roles,
			})
		) {
			throw new OperationError(
				403,
				"You cannot manage a member with an equal or higher role",
			)
		}

		const addRoles = Array.isArray(payload.add_roles) ? payload.add_roles : []
		const removeRoles = Array.isArray(payload.remove_roles)
			? payload.remove_roles
			: []

		for (const roleKey of addRoles) {
			if (!authz.canAssignRole(roleKey)) {
				throw new OperationError(403, `You cannot assign the role ${roleKey}`)
			}
		}

		for (const roleKey of removeRoles) {
			if (!authz.canRemoveRole(roleKey)) {
				throw new OperationError(403, `You cannot remove the role ${roleKey}`)
			}
		}

		member = await GroupRoles.updateMember({
			group: authz.group,
			membership: member,
			user_id: member.user_id,
			add: addRoles,
			remove: removeRoles,
		})

		const groupRoles = await GroupRoles.getByGroupId(authz.group._id)
		const rolesByKey = new Map(groupRoles.map((role) => [role.role_key, role]))

		const resolvedRoles = resolveMemberRoles(
			member.roles,
			rolesByKey,
			member.user_id === authz.group.owner_user_id,
		)

		const membershipPayload = {
			group_id: authz.group._id,
			membership_id: member._id,
			user_id: member.user_id,
			roles: resolvedRoles,
		}

		if (global.websockets) {
			try {
				global.websockets.senders.toTopic(
					`group:${authz.group._id}`,
					`group:${authz.group._id}:membership:updated`,
					membershipPayload,
				)
			} catch (error) {
				console.error("Failed to broadcast membership update", error)
			}

			try {
				global.websockets.senders.toUserId(
					member.user_id,
					"groups:membership:updated",
					membershipPayload,
				)
			} catch (error) {
				console.error("Failed to send membership update to user", error)
			}
		}

		return {
			ok: true,
			member: {
				...member.toRaw(),
				roles: resolvedRoles,
			},
		}
	},
})
