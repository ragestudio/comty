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

		let channel = new GroupChannel({
			name: req.body.name,
			description: req.body.description,
			group_id: req.params.group_id,
			kind: req.body.kind,
			encoding_params: {
				...req.body.encoding_params,
				maxBitrate: 98000,
			},
		})

		await channel.save()

		return channel
	},
}
