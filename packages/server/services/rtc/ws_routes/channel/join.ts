import type { API } from "@services/rtc/rtc.service"
import type { RTCClient } from "@services/rtc/types"
import type { RTC_JoinPayload as JoinPayload } from "@comty/shared/types/rtc/events/index"
import type { HandlerKind } from "linebridge"
import type { JoinChannelResult } from "@comty/shared/types/rtc/handlers/joinChannel"

export default defineRoute<API, HandlerKind.ws>()({
	useContexts: ["mediaChannels"],
	fn: async (
		client: RTCClient,
		payload: JoinPayload,
		ctx,
	): Promise<JoinChannelResult> => {
		if (typeof payload !== "object") {
			throw new OperationError(400, "Invalid payload")
		}

		if (typeof payload?.channel_id !== "string") {
			throw new OperationError(400, "Invalid channel_id")
		}

		if (typeof payload?.group_id !== "string") {
			throw new OperationError(400, "Invalid group_id")
		}

		return await ctx.mediaChannels.joinClient(
			client,
			payload.group_id,
			payload.channel_id,
		)
	},
})
