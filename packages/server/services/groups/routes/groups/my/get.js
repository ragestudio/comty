import Groups from "@shared-classes/Spaces/Groups"

export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	fn: async (req) => {
		// TODO: implement pagination
		//const { limit, offset } = req.query

		const groups = await Groups.getManyByJoinedUserId(
			req.auth.session.user_id,
		)

		return {
			items: groups,
		}
	},
}
