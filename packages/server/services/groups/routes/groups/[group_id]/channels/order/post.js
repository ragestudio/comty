import Groups from "@classes/Groups"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Groups.orderChannels(
			req.params.group_id,
			req.body.order,
			req.auth.session.user_id,
		)
	},
}
