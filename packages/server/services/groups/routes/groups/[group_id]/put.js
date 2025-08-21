import Groups from "@classes/Groups"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Groups.update(
			req.params.group_id,
			req.body,
			req.auth.session.user_id,
		)
	},
}
