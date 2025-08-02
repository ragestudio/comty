import { Group, GroupChannel } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Group.findById(req.params.group_id).catch(() => null)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (group.owner_user_id !== req.auth.session.user_id) {
			throw new OperationError(403, "You are not the owner of this group")
		}

		const channel = await GroupChannel.findById(req.params.channel_id).catch(
			() => null,
		)

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		await GroupChannel.deleteOne({ _id: channel._id.toString() })

		return channel
	},
}
