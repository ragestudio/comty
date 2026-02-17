import GroupSoundpad from "@shared-classes/Spaces/GroupSoundpad"

export default {
	fn: async (req, res) => {
		return await GroupSoundpad.getItems(req.params.group_id)
	},
}
