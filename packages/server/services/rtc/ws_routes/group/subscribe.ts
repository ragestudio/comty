import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, group_id: string, ctx) => {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id is required")
		}

		// first validate if this client can access this group
		await ctx.mediaChannels.validateGroupAccess(client.userId, group_id)

		// now subscribe to the topic
		await client.subscribe(`group:${group_id}`)

		return {
			ok: true,
			group_id: group_id,
		}
	},
})
