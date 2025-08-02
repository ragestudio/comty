import { Group, GroupChannel, User } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		let group = await Group.findById(req.params.group_id)
			.lean()
			.catch(() => null)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const membership = group.members.find(
			(member) => member.user_id === req.auth.session.user_id,
		)

		if (!membership) {
			throw new OperationError(403, "You are not a member of this group")
		}

		group.channels = await GroupChannel.find({
			group_id: group._id,
		}).lean()

		group.channels.map((channel) => {
			// TODO: fetch current clients of that channel
			channel.clients = []

			return channel
		})

		return group
	},
}
