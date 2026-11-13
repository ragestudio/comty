import type API from "@services/users/users.service"
import type { SoundpadItemPayload } from "@comty/shared/types/spaces/soundpad"

import UserSoundpad from "@shared-classes/Spaces/UserSoundpad"

type RouteParams = {
	item_id: string
}

type RouteBody = Record<string, any>

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { item_id } = req.params as RouteParams
		const body = (req.body ?? {}) as RouteBody

		return await UserSoundpad.updateItem({
			...body,
			_id: item_id,
			user_id: req.auth.session.user_id,
		} as SoundpadItemPayload)
	},
})
