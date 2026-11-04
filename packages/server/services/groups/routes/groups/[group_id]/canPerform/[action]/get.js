import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		return {
			result: authz.can(req.params.action),
		}
	},
}
