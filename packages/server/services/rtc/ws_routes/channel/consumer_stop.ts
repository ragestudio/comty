import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { StopConsumePayload } from "@classes/MediaChannel/handlers/stopConsume"

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: StopConsumePayload, ctx) => {
		let channelInstance = await ctx.mediaChannels.getClientChannel(client)

		if (!channelInstance) return null

		return await channelInstance.stopConsume(client, payload)
	},
})
