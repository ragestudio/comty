import type API from "@services/rtc/rtc.service"

import Groups from "@shared-classes/Spaces/Groups"

export default defineRoute<API>()({
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	fn: async (req) => {
		const { group_id } = req.params
		// @ts-ignore
		const user_id = req.auth.session.user_id

		return await Groups.canUserIdReach(user_id, group_id)
	},
})
