import { User } from "@db_models"
import Groups from "@shared-classes/Spaces/Groups"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"
import GroupPermissions from "@shared-classes/Spaces/GroupPermissions"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { limit = 50, offset } = req.query

		const group = await Groups.get(req.params.group_id, req.auth.user_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (
			!(await GroupPermissions.canPerformAction(
				req.auth.user_id,
				group,
				"READ_MEMBERSHIPS",
			))
		) {
			throw new OperationError(403, "You are not allowed to read members")
		}

		const totalMembers = await GroupMemberships.getTotalMembersByGroupId(
			group._id,
		)

		let items = await GroupMemberships.getByGroupId(group._id, {
			limit: limit,
			offset: offset,
		})

		items = items.map((item) => {
			if (!Array.isArray(item.roles)) {
				item.roles = []
			}

			item.roles.push({
				_id: "member",
				label: "Member",
			})

			if (item.user_id === group.owner_user_id) {
				item.roles.push({
					_id: "owner",
					label: "Owner",
					color: "orange",
				})
			}

			return item
		})

		let users = await User.find({
			_id: {
				$in: items.map((item) => item.user_id),
			},
		}).lean()

		users = new Map(users.map((user) => [user._id.toString(), user]))

		items = items.map((item) => {
			return {
				...item.toJSON(),
				user: users.get(item.user_id),
			}
		})

		return {
			total_items: totalMembers,
			items: items,
		}
	},
}
