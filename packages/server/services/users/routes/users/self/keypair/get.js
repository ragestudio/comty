import { UserDHKeyPair } from "@db_models"

export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		const userId = req.auth.session.user_id

		return await UserDHKeyPair.findOne({
			user_id: userId,
		})
	},
}
