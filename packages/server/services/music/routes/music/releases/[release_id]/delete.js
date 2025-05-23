import ReleaseClass from "@classes/release"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await ReleaseClass.delete(req.params.release_id, {
			user_id: req.auth.session.user_id,
		})
	},
}
