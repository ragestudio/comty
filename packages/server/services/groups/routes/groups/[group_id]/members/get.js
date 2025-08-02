import { Group, User } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { limit = 50, page = 0 } = req.query

		const group = await Group.findById(req.params.group_id).catch(() => null)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const users = await User.find({
			_id: {
				$in: group.members.map((member) => member.user_id),
			},
		})
			.lean()
			.limit(limit)
			.skip(page * limit)

		if (users.length === 0) {
			return {
				items: [],
				total_items: group.members.length,
				has_more: false,
			}
		}

		const userMap = new Map(users.map((user) => [user._id.toString(), user]))

		const members = group.members.map((member) => {
			const user = userMap.get(member.user_id)

			return {
				...user,
				joined_at: member.joined_at,
			}
		})

		const nextPage = page + 1

		return {
			items: members,
			total_items: group.members.length,
			has_more: group.members.length > limit * nextPage,
		}
	},
}
