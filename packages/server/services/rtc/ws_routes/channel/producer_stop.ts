import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { StopProducePayload } from "@classes/MediaChannel/handlers/stopProduce"

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: StopProducePayload, ctx) => {
		let channelInstance = await ctx.mediaChannels.getClientChannel(client)

		if (!channelInstance) return null

		return await channelInstance.stopProduce(client, payload)
	},
})
