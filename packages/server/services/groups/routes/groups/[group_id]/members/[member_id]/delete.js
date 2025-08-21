import GroupMemberships from "@classes/GroupMemberships"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await GroupMemberships.delete(
			req.params.member_id,
			req.params.group_id,
			req.auth.session.user_id,
		)
	},
}
