import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { RTC_ChannelEventPayload as ChannelPayload } from "@comty/shared/types/rtc/events/index"

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: ChannelPayload, ctx) => {
		let channelInstance = await ctx.mediaChannels.getClientChannel(client)

		// if (payload.isDm === true) {
		// 	channelInstance = ctx.userCalls.getClientChannel(client)
		// } else {
		// 	channelInstance = await ctx.mediaChannels.getClientChannel(client)
		// }

		if (!channelInstance) {
			throw new OperationError(404, "No channel available")
		}

		return await channelInstance.handleClientEvent(client, payload)
	},
})
