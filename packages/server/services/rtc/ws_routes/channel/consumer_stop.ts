import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { StopConsumePayload } from "@classes/MediaChannel/handlers/stopConsume"

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: StopConsumePayload, ctx) => {
		return await ctx.mediaChannels.runChannelOperation(client, (channel) =>
			channel.stopConsume(client, payload),
		)
	},
})
