import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupSoundpad from "@shared-classes/Spaces/GroupSoundpad"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_SOUNDPAD")

		return await GroupSoundpad.addItem({
			group_id: authz.group._id,
			user_id: authz.userId,
			icon: req.body?.icon,
			name: req.body?.name,
			src: req.body?.src,
		})
	},
}
