import Groups from "@shared-classes/Spaces/Groups"

// make sure only the owner can delete the group
export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const group = await Groups.get(req.params.group_id, req.auth.user_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (group.owner_user_id !== req.auth.user_id) {
			throw new OperationError(
				403,
				"You are not allowed to delete this group",
			)
		}

		return await Groups.delete(group)
	},
}
