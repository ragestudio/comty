import Inventory from "@shared-classes/Inventory"

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { user_id, kind, item_id } = req.params

		const targetUserId =
			user_id === "self" ? req.auth.session.user_id : user_id

		return await Inventory.revoke({
			user_id: targetUserId,
			kind,
			item_id,
		})
	},
}
