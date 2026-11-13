import type API from "@services/users/users.service"

import UserSoundpad from "@shared-classes/Spaces/UserSoundpad"

type RouteParams = {
	item_id: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { item_id } = req.params as RouteParams

		return await UserSoundpad.getItem({
			_id: item_id,
			user_id: req.auth.session.user_id,
		})
	},
})
