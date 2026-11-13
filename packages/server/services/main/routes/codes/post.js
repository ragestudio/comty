import Redeem from "@classes/redeem"

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		return await Redeem.createCode({
			...req.body,
			created_by: req.auth.session.user_id,
		})
	},
}
