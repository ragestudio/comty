import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import GroupSoundpad from "@shared-classes/Spaces/GroupSoundpad"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const authz = await Gatekeeper.fromRequest(req)

		authz.require("READ_CHANNELS")

		const item = await GroupSoundpad.getItem({
			_id: req.params.item_id,
			group_id: authz.group._id,
		})

		if (!item) {
			throw new OperationError(404, "Item not found")
		}

		return item
	},
}
