import GroupSoundpad from "@classes/GroupSoundpad"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const user_id = req.auth.session.user_id

		return await GroupSoundpad.addItem({
			group_id: req.params.group_id,
			user_id: user_id,
			icon: req.body.icon,
			name: req.body.name,
			src: req.body.src,
		})
	},
}
