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

		const member_id = req.params.member_id

		const membership = group.members.find(
			(member) => member.user_id === member_id,
		)

		if (!membership) {
			throw new OperationError(404, "Member not found")
		}

		group.members.filter((member) => member.user_id !== member_id)

		await group.save()

		return group
	},
}
