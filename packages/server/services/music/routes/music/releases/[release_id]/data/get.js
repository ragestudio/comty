import ReleaseClass from "@classes/release"

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req) => {
		const { release_id } = req.params
		const { limit = 50, offset = 0 } = req.query

		return await ReleaseClass.data(release_id, {
			user_id: req.auth?.session?.user_id,
			limit,
			offset,
		})
	},
}
