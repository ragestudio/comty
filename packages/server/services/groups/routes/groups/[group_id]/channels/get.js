import GroupChannels from "@classes/GroupChannels"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await GroupChannels.getByGroupId(
			req.params.group_id,
			req.auth.session.user_id,
		)
	},
}
