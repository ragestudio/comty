import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"

interface JoinPayload {
	is_dm?: boolean
	channel_id?: string
	group_id?: string
	[key: string]: any
}

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: JoinPayload, ctx) => {
		if (typeof payload !== "object") {
			throw new OperationError(400, "Invalid payload")
		}

		if (typeof payload?.channel_id !== "string") {
			throw new OperationError(400, "Invalid channel_id")
		}

		if (typeof payload?.group_id !== "string") {
			throw new OperationError(400, "Invalid group_id")
		}

		return await ctx.mediaChannels.joinClient(
			client,
			payload.group_id,
			payload.channel_id,
		)
	},
})
