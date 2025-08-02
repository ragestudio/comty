import { Group } from "@db_models"

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

		const user_id = req.body.user_id

		if (group.members.includes(user_id)) {
			throw new OperationError(400, "User is already a member of this group")
		}

		group.members.push({
			user_id: user_id,
			joined_at: Date.now(),
		})

		await group.save()

		return group
	},
}
