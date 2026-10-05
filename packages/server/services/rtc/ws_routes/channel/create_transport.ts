import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { HandlerKind } from "linebridge"
import type { SerializedCreateTransport } from "@comty/shared/types/rtc/handlers/createTransport"

export default defineRoute<API, HandlerKind.ws>()({
	useContexts: ["mediaChannels"],
	fn: async (
		client: RTCClient,
		payload,
		ctx,
	): Promise<SerializedCreateTransport> => {
		let channelInstance = await ctx.mediaChannels.getClientChannel(client)

		// if (payload.isDm === true) {
		// 	channelInstance = ctx.userCalls.getClientChannel(client)
		// } else {
		// 	channelInstance = await ctx.mediaChannels.getClientChannel(client)
		// }

		if (!channelInstance) {
			throw new OperationError(404, "No channel available")
		}

		return await channelInstance.createTransport(client)
	},
})
