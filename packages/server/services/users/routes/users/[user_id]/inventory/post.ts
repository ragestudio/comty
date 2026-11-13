import type API from "@services/users/users.service"
import Inventory from "@shared-classes/Inventory"

type RouteParams = { user_id: string }
type RouteBody = {
	kind: string
	item_id: string
	source?: string
	metadata?: Record<string, any>
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { user_id } = req.params as RouteParams
		const { kind, item_id, source, metadata } = (req.body ??
			{}) as RouteBody

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
})
