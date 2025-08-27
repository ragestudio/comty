import Groups from "@classes/Groups"
import GroupMemberships from "../GroupMemberships"

export default class GroupPermissions {
	// FIXME: by the moment, only the owner can create a channel.
	// implements a proper system
	static async hasUserPermission(user_id, group_id, type) {
		if (typeof user_id !== "string") {
			return false
		}

		if (typeof group_id !== "string") {
			return false
		}

		if (typeof type !== "string") {
			return false
		}

		const group = await Groups.model.findOneAsync(
			{
				_id: group_id,
			},
			{ raw: true },
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const group_memberships = await GroupMemberships.model.findAsync(
			{
				group_id: group_id,
			},
			{ raw: true },
		)

		switch (type) {
			case "read_channel": {
				// check if the server is public
				if (group.reachability !== "public") {
					// check if the user is in the memberships
					if (
						!group_memberships.find(
							(member) => member.user_id === user_id,
						)
					) {
						return false
					}
				}

				return true
			}
			case "order_channels":
			case "delete_channel":
			case "update_channel":
			case "create_channel": {
				if (group.owner_user_id !== user_id) {
					return false
				}

				return true
			}
			default: {
				return false
			}
		}
	}
}
