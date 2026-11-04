import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import Groups from "@shared-classes/Spaces/Groups"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("UPDATE_GROUP")

		return await Groups.update(authz.group, req.body)
	},
}
