import GroupRoles from "@shared-classes/Spaces/GroupRoles"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default async function (user_id, group, action) {
	if (typeof user_id !== "string") {
		throw new OperationError(400, "user_id must be provided")
	}

	if (typeof group !== "object") {
		throw new OperationError(400, "group must be provided")
	}

	if (typeof action !== "string") {
		throw new OperationError(400, "action must be provided")
	}

	// check if action exist in the enum
	if (typeof this.enum[action] === "undefined") {
		throw new OperationError(400, "Invalid action")
	}

	// if the user is the owner of the group, they can do anything
	if (group.owner_user_id === user_id) {
		return true
	}

	// get the user membership
	const membership = await GroupMemberships.model.findOneAsync(
		{
			user_id: user_id,
		},
		{
			raw: true,
		},
	)

	if (!membership) {
		throw new OperationError(404, "Membership not found")
	}

	if (!Array.isArray(membership.roles)) {
		membership.roles = []
	}

	// if the user has admin, they can bypass all permissions
	if (membership.roles.includes("admin")) {
		return true
	}

	// add the member role to user due is a member
	if (!membership.roles.includes("member")) {
		membership.roles.push("member")
	}

	// get the group roles
	const roles = await GroupRoles.getByGroupId(group._id)

	// iterate for explicit permission
	for (const roleKey of membership.roles) {
		const role = roles.find((role) => role.role_key === roleKey)

		if (!role) {
			continue
		}

		if (!role.permissions) {
			continue
		}

		if (!role.permissions.includes(action)) {
			continue
		}

		return true
	}

	return false
}
