import Groups from "@classes/Groups"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Groups.delete(
			req.params.group_id,
			req.auth.session.user_id,
		)
	},
}
