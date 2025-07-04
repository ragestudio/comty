import Users from "@classes/users"

export default {
	useMiddlewares: ["withOptionalAuthentication"],
	fn: async (req) => {
		const data = await Users.data({
			user_id: req.auth.session.user_id,
		})

		return data.roles
	},
}
