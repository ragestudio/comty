import Library from "@classes/library"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const userId = req.auth.session.user_id
		const { limit = 50, offset = 0, kind } = req.query

		return await Library.getUserLibrary({
			user_id: userId,
			limit: limit,
			offset: offset,
			kind: kind,
		})
	},
}
