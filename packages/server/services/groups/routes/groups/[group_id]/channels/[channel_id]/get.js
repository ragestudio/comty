import { Group, GroupChannel } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Group.findById(req.params.group_id).catch(() => null)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const membership = group.members.find(
			(member) => member.user_id === req.auth.session.user_id,
		)

		if (!membership) {
			throw new OperationError(403, "You are not a member of this group")
		}

		const channel = await GroupChannel.findById(req.params.channel_id).catch(
			() => null,
		)

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		return channel
	},
}
