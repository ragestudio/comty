import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { StopProducePayload } from "@classes/MediaChannel/handlers/stopProduce"

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: StopProducePayload, ctx) => {
		return await ctx.mediaChannels.runChannelOperation(client, (channel) =>
			channel.stopProduce(client, payload),
		)
	},
})
