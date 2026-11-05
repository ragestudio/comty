import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { SerializedCreateTransport } from "@comty/shared/types/rtc/handlers/createTransport"

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["mediaChannels"],
	fn: async (
		client: RTCClient,
		_payload,
		ctx,
	): Promise<SerializedCreateTransport> => {
		return await ctx.mediaChannels.runChannelOperation(client, (channel) =>
			channel.createTransport(client),
		)
	},
})
