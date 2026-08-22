import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { IPC_ConsumerControlPayload } from "@comty/shared/types/rtc/events/index"

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: IPC_ConsumerControlPayload, ctx) => {
		let channelInstance = await ctx.mediaChannels.getClientChannel(client)

		if (!channelInstance) {
			throw new OperationError(404, "No channel available")
		}

		return await channelInstance.consumerControl(client, payload)
	},
})
