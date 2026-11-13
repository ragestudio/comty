import type API from "@services/users/users.service"
import Inventory from "@shared-classes/Inventory"

type RouteParams = { user_id: string; kind: string; item_id: string }

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { user_id, kind, item_id } = req.params as RouteParams

		const targetUserId =
			user_id === "self" ? req.auth.session.user_id : user_id

		return await Inventory.revoke({
			user_id: targetUserId,
			kind,
			item_id,
		})
	},
})
