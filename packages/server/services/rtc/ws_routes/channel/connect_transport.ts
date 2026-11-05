import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { RTC_ConnectTransportPayload as TransportPayloadReq } from "@comty/shared/types/rtc/events/index"

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: TransportPayloadReq, ctx) => {
		return await ctx.mediaChannels.runChannelOperation(client, (channel) =>
			channel.connectTransport(client, payload),
		)
	},
})
