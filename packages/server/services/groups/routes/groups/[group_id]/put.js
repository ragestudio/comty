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

		if (req.body.name) {
			group.name = req.body.name
		}

		if (req.body.description) {
			group.description = req.body.description
		}

		await group.save()

		return group
	},
}
