import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_CHANNELS")

		return await GroupChannels.create(authz.group, req.body)
	},
}
