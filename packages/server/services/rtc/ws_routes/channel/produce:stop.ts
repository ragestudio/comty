import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { StopProducePayload } from "@classes/MediaChannel/handlers/stopProduce"

interface StopProducePayloadReq extends StopProducePayload {
	isDm?: boolean
	[key: string]: any
}

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: StopProducePayloadReq, ctx) => {
		let channelInstance = await ctx.mediaChannels.getClientChannel(client)

		// if (payload.isDm === true) {
		// 	channelInstance = ctx.userCalls.getClientChannel(client)
		// } else {
		// 	channelInstance = await ctx.mediaChannels.getClientChannel(client)
		// }

		if (!channelInstance) {
			return null
		}

		return await channelInstance.stopProduce(client, payload)
	},
})
