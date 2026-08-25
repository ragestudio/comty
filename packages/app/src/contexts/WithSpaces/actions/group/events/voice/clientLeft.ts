import type EventsActions from "../index"
import type { ClientVoiceLeftPayload } from "../../../../stores/group/types"

export default function (
	this: EventsActions,
	payload: ClientVoiceLeftPayload,
): void {
	this.setState((state) => {
		const channel = state.statedChannels[payload.channelId]
		if (!channel) return state

		return {
			statedChannels: {
				...state.statedChannels,
				[payload.channelId]: {
					...channel,
					clients: channel.clients.filter(
						(c) => c.userId !== payload.userId,
					),
				},
			},
		}
	})
}
