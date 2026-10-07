import type EventsActions from "../index"
import type { ClientVoiceJoinPayload } from "@/group/types"
import type { Client } from "@comty/shared/types/rtc/client"

import { adapter } from "@/adapter"

export default async function (
	this: EventsActions,
	payload: ClientVoiceJoinPayload,
): Promise<void> {
	if (!adapter.sessionGetter) {
		throw new Error("sessionGetter is not registered")
	}

	const session = await adapter.sessionGetter()

	this.setState((state) => {
		const channel = state.statedChannels[payload.channelId] ?? {
			_id: payload.channelId,
			clients: [],
			producers: [],
		}

		if (channel.clients.some((c) => c.userId === payload.userId)) {
			return state
		}

		const client: Client = {
			channel_id: payload.channelId,
			userId: payload.userId,
			user: payload.user,
			voiceState: payload.voiceState,
			self: payload.userId === session.user_id,
		}

		return {
			statedChannels: {
				...state.statedChannels,
				[payload.channelId]: {
					...channel,
					clients: [...channel.clients, client],
				},
			},
		}
	})

	this.state.actions.evaluateDecorations([payload.userId])
}
