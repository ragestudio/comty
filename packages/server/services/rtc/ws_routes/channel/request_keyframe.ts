import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { SfuRequestKeyframePayload } from "@comty/shared/types/sfu/index"

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: SfuRequestKeyframePayload, ctx) => {
		return await ctx.mediaChannels.runChannelOperation(client, (channel) =>
			channel.sfu_node.requestKeyframe(payload),
		)
	},
})
