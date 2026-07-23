import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { ConnectTransportPayload } from "@classes/MediaChannel/handlers/connectTransport"

interface TransportPayloadReq extends ConnectTransportPayload {
	isDm?: boolean
	[key: string]: any
}

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels"] as const,
	fn: async (client: RTCClient, payload: TransportPayloadReq, ctx) => {
		let channelInstance = await ctx.mediaChannels.getClientChannel(client)

		// if (payload.isDm === true) {
		// 	channelInstance = ctx.userCalls.getClientChannel(client)
		// } else {
		// 	channelInstance = await ctx.mediaChannels.getClientChannel(client)
		// }

		if (!channelInstance) {
			throw new OperationError(404, "No channel available")
		}

		return await channelInstance.connectTransport(client, payload)
	},
})
