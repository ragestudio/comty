import Redeem from "@classes/redeem"

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		return await Redeem.getCode(req.params.code_id)
	},
}
