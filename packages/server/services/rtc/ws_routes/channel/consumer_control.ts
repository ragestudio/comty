import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { SfuConsumerControlPayload } from "@comty/shared/types/sfu/index"

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["mediaChannels"],
	fn: async (client: RTCClient, payload: SfuConsumerControlPayload, ctx) => {
		let channelInstance = await ctx.mediaChannels.getClientChannel(client)

		if (!channelInstance) {
			throw new OperationError(404, "No channel available")
		}

		return await channelInstance.consumerControl(client, payload)
	},
})
