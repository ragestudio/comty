import Inventory from "@shared-classes/Inventory"

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { user_id } = req.params
		const { kind, item_id, source, metadata } = req.body ?? {}

		const targetUserId =
			user_id === "self" ? req.auth.session.user_id : user_id

		return await Inventory.grant({
			user_id: targetUserId,
			kind,
			item_id,
			source: source ?? "admin",
			granted_by: req.auth.session.user_id,
			metadata: metadata ?? {},
		})
	},
}
