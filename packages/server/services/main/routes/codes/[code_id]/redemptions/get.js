import Redeem from "@classes/redeem"

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { limit, offset } = req.query

		return await Redeem.getRedemptions(req.params.code_id, {
			limit,
			offset,
		})
	},
}
