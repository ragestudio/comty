import Users from "@classes/users"

export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		return await Users.data({
			user_id: req.auth.session.user_id,
			add: ["email"],
		})
	},
}
