import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupSoundpad from "@shared-classes/Spaces/GroupSoundpad"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_SOUNDPAD")

		return await GroupSoundpad.removeItem({
			group_id: authz.group._id,
			_id: req.params.item_id,
		})
	},
}
