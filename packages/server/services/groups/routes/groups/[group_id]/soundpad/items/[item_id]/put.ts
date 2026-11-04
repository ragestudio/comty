import API from "@services/groups/groups.service"
import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupSoundpad from "@shared-classes/Spaces/GroupSoundpad"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("MANAGE_SOUNDPAD")

		const update = await GroupSoundpad.updateItem({
			...req.body,
			_id: req.params.item_id,
			group_id: req.params.group_id,
		})

		return update.toObject()
	},
})
