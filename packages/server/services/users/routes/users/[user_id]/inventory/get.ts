import type API from "@services/users/users.service"
import Inventory from "@shared-classes/Inventory"

type RouteParams = { user_id: string }
type RouteQuery = { kind?: string; include_orphaned?: string | boolean }

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { user_id } = req.params as RouteParams
		const { kind, include_orphaned } = req.query as RouteQuery
		const sessionUserId = req.auth.session.user_id

		const targetUserId =
			user_id === "self" ? sessionUserId : String(user_id)

		if (targetUserId !== String(sessionUserId)) {
			const user = await req.auth.user()

			if (!user?.roles?.includes("admin")) {
				throw new OperationError(403, "Forbidden")
			}
		}

		const options = {
			kind,
			includeOrphaned: ToBoolean(include_orphaned),
		}

		const items = await Inventory.list(targetUserId, options)

		return { items }
	},
})
