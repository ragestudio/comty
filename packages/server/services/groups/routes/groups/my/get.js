import { Group, GroupChannel } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { limit = 10, page = 0 } = req.query

		const user_id = req.auth.session.user_id

		const groupsQuery = {
			members: { $elemMatch: { user_id } },
		}

		const totalGroups = await Group.countDocuments(groupsQuery)

		let groups = await Group.find(groupsQuery)
			.sort({ created_at: -1 })
			.skip(page * limit)
			.limit(limit)
			.lean()

		let channels = await GroupChannel.find({
			group_id: { $in: groups.map((group) => group._id.toString()) },
		})
			.sort({ created_at: -1 })
			.lean()

		// inyect channels to groups
		for await (let group of groups) {
			group.channels = channels.filter(
				(channel) => channel.group_id === group._id.toString(),
			)
		}

		return {
			items: groups,
			total_items: totalGroups,
		}
	},
}
