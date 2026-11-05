import type { API } from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"

export type RebindChannelResult = {
	ok: boolean
	channelId?: string
	started_at?: Date
	clients?: any[]
	producers?: any[]
}

export default defineRoute<API, HandlerKind["ws"]>()({
	useContexts: ["mediaChannels"],
	fn: async (
		client: RTCClient,
		_payload,
		ctx,
	): Promise<RebindChannelResult> => {
		if (!client.userId) {
			throw new OperationError(401, "Unauthorized")
		}

		const channelId = await ctx.mediaChannels.users.get(client.userId)

		if (!channelId) {
			return { ok: false }
		}

		const channel = await ctx.mediaChannels.getInstance(channelId, client)

		if (!channel || channel.closed) {
			return { ok: false }
		}

		// a reconnection must not trigger the disconnect grace period
		ctx.mediaChannels.cancelPendingDisconnect(client.userId)

		// a remote channel answers with the whole session state
		const result = await channel.rebindClient(client)

		if (!result?.ok) {
			return { ok: false }
		}

		return {
			ok: true,
			channelId: channel.channelId,
			started_at: result.started_at ?? channel.started_at,
			clients: result.clients,
			producers: result.producers,
		}
	},
})
