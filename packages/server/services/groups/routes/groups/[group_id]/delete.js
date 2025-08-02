import { Group, GroupMediaChannel } from "@db_models"

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

		const associatedChannels = await GroupMediaChannel.find({
			group_id: req.params.group_id,
		}).catch(() => null)

		for (const channel of associatedChannels) {
			await GroupMediaChannel.deleteOne({ _id: channel._id.toString() })
		}

		await Group.deleteOne({ _id: group._id.toString() })

		return group
	},
}
