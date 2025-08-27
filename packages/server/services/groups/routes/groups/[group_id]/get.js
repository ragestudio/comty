import { Group, GroupChannel, User } from "@db_models"

import Groups from "@classes/Groups"

export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	fn: async (req) => {
		return await Groups.canUserIdReach(
			req.auth.session.user_id,
			req.params.group_id,
		)
	},
}
