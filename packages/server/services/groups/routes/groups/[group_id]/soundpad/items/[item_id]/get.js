import GroupSoundpad from "@classes/GroupSoundpad"

export default {
	fn: async (req, res) => {
		return await GroupSoundpad.getItem({
			_id: req.params.item_id,
			group_id: req.params.group_id,
		})
	},
}
