import type API from "@services/main/main.service"
import Redeem from "@classes/redeem"

type RouteParams = {
	code_id: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req) => {
		const { code_id } = req.params as RouteParams

		return await Redeem.getCode(code_id)
	},
})
