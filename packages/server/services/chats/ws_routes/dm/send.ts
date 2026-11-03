import type API from "@services/chats/chats.service"

import { resolveClientUser } from "@shared-utils/clientUser"

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["dmChannels", "redis"] as const,
	fn: async (client, payload, ctx) => {
		if (!client.userId) {
			throw new OperationError(400, "Missing userId")
		}

		if (!payload.to_user_id) {
			throw new OperationError(400, "Missing to_user_id")
		}

		const from_user_id = client.userId
		const to_user_id = payload.to_user_id

		const user = await resolveClientUser(client, ctx.redis?.client)

		if (!user) {
			throw new OperationError(400, "Missing user")
		}

		const room = await ctx.dmChannels.get(from_user_id, to_user_id)

		return await room.write(user, payload)
	},
})
