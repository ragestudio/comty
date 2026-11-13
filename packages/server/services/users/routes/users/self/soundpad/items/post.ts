import type API from "@services/users/users.service"
import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import UserSoundpad from "@shared-classes/Spaces/UserSoundpad"

type RouteBody = {
	icon?: string
	name?: string
	src?: string
}

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { icon, name, src } = (req.body ?? {}) as RouteBody

		return await UserSoundpad.addItem({
			user_id: req.auth.session.user_id,
			icon,
			name,
			src,
		} as SoundpadItemPayload)
	},
})
