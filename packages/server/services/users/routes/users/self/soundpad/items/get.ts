import type API from "@services/users/users.service"

import UserSoundpad from "@shared-classes/Spaces/UserSoundpad"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		return await UserSoundpad.getItems(req.auth.session.user_id)
	},
})
