import Users from "@classes/users"

export default {
	middlewares: ["withOptionalAuthentication"],
	fn: async (req) => {
		const { user_id } = req.params

		const ids = user_id.split(",")

		return await Users.data({
			user_id: ids.length > 1 ? ids : user_id,
			from_user_id: req.auth?.session.user_id,
			basic: req.query?.basic,
		})
	},
}
