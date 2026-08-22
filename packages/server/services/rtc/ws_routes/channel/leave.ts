import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { RTC_LeavePayload as LeavePayload } from "@comty/shared/types/rtc/events/index"

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: LeavePayload = {}, ctx) => {
		// if (payload.isDm === true) {
		// 	const channelInstance = ctx.userCalls.getClientChannel(client)

		// 	if (!channelInstance) {
		// 		throw new OperationError(404, "No channel available")
		// 	}

		// 	return await channelInstance.leaveClient(client)
		// }

		return await ctx.mediaChannels.leaveClient(client)
	},
})
