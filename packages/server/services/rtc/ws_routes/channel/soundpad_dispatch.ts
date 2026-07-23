import type API from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"

interface SoundpadPayload {
	isDm?: boolean
	[key: string]: any
}

export default defineRoute<API, "ws">()({
	useContexts: ["mediaChannels", "userCalls"] as const,
	fn: async (client: RTCClient, payload: SoundpadPayload, ctx) => {
		let channelInstance = null

		if (payload.isDm === true) {
			channelInstance = ctx.userCalls.getClientChannel(client)
		} else {
			channelInstance = await ctx.mediaChannels.getClientChannel(client)
		}

		if (!channelInstance) {
			throw new OperationError(404, "No channel available")
		}

		return await channelInstance.handleSoundpadDispatch(client, payload)
	},
})
