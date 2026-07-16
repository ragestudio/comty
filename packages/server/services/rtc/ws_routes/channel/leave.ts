import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"

interface LeavePayload {
	isDm?: boolean
	[key: string]: any
}

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels", "userCalls"] as const,
	fn: async (client: RTCClient, payload: LeavePayload = {}, ctx) => {
		if (payload.isDm === true) {
			const channelInstance = ctx.userCalls.getClientChannel(client)

			if (!channelInstance) {
				throw new OperationError(404, "No channel available")
			}

			return await channelInstance.leaveClient(client)
		}

		return await ctx.mediaChannels.leaveClient(client)
	},
})
