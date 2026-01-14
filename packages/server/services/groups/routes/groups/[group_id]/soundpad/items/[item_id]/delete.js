import GroupSoundpad from "@shared-classes/Spaces/GroupSoundpad"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const user_id = req.auth.session.user_id

		const item = await GroupSoundpad.getItem({
			_id: req.params.item_id,
			group_id: req.params.group_id,
		})

		if (!item) {
			throw new OperationError(404, "Item not found")
		}

		if (item.user_id !== user_id) {
			const user = await req.auth.user()

			if (!user.roles.includes("admin")) {
				throw new OperationError(
					403,
					"You are not allowed to delete this item",
				)
			}
		}

		return await GroupSoundpad.removeItem({
			group_id: req.params.group_id,
			_id: req.params.item_id,
		})
	},
}
