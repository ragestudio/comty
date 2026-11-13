import Redeem from "@classes/redeem"

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		return await Redeem.disableCode(req.params.code_id)
	},
}
