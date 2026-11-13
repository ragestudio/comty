import Redeem from "@classes/redeem"

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { limit, offset, enabled } = req.query

		return await Redeem.listCodes({
			limit,
			offset,
			enabled,
		})
	},
}
