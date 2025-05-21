import Library from "@classes/library"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { kind, item_id } = req.query

		if (!kind || !item_id) {
			throw new OperationError(
				"Missing parameters. Required: {kind, item_id}",
			)
		}

		return await Library.isFavorite(req.auth.session.user_id, item_id, kind)
	},
}
