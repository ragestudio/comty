import GroupChannels from "@classes/GroupChannels"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await GroupChannels.get(
			req.params.group_id,
			req.params.channel_id,
			req.auth.session.user_id,
		)
	},
}
