import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { SfuConsumerControlPayload } from "@comty/shared/types/sfu/index"

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["mediaChannels"],
	fn: async (client: RTCClient, payload: SfuConsumerControlPayload, ctx) => {
		return await ctx.mediaChannels.runChannelOperation(client, (channel) =>
			channel.consumerControl(client, payload),
		)
	},
})
