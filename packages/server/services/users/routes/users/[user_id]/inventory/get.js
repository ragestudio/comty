import Inventory from "@shared-classes/Inventory"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { user_id } = req.params
		const sessionUserId = req.auth.session.user_id

		const targetUserId =
			user_id === "self" ? sessionUserId : String(user_id)

		if (targetUserId !== String(sessionUserId)) {
			const user = await req.auth.user()

			if (!user?.roles?.includes("admin")) {
				throw new OperationError(403, "Forbidden")
			}
		}

		const items = await Inventory.list(targetUserId, {
			kind: req.query.kind,
			includeOrphaned: ToBoolean(req.query.include_orphaned),
		})

		return { items }
	},
}
