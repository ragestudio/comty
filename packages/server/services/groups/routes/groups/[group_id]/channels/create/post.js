import GroupChannels from "@classes/GroupChannels"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await GroupChannels.create(
			req.params.group_id,
			req.body,
			req.auth.session.user_id,
		)
	},
}
