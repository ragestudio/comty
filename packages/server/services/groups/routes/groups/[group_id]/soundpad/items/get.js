import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupSoundpad from "@shared-classes/Spaces/GroupSoundpad"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("READ_CHANNELS")

		return await GroupSoundpad.getItems(authz.group._id)
	},
}
