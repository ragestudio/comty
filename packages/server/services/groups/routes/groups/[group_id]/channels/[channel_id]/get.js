import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("READ_CHANNELS")

		return await GroupChannels.get(authz.group, req.params.channel_id)
	},
}
