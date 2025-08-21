import { User } from "@db_models"
import GroupMemberships from "@classes/GroupMemberships"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { limit = 50, offset } = req.query

		const totalMembers = await GroupMemberships.getTotalMembersByGroupId(
			req.params.group_id,
		)

		let items = await GroupMemberships.getByGroupId(req.params.group_id, {
			limit: limit,
			offset: offset,
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

		// TODO: add pagination
		return {
			total_items: totalMembers,
			items: items,
		}
	},
}
