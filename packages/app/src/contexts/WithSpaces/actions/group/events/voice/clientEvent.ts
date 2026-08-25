import type EventsActions from "../index"
import type { ClientEventPayload } from "../../../../stores/group/types"

export default function (
	this: EventsActions,
	payload: ClientEventPayload,
): void {
	if (payload.event !== "updateVoiceState") return

	this.setState((state) => {
		const channel = state.statedChannels[payload.channelId]
		if (!channel) return state

		const clientIndex = channel.clients.findIndex(
			(c) => c.userId === payload.userId,
		)
		if (clientIndex === -1) return state

		const updatedClient = {
			...channel.clients[clientIndex],
			voiceState: {
				...channel.clients[clientIndex].voiceState,
				...payload.data,
			},
		}

		const newClients = [...channel.clients]
		newClients[clientIndex] = updatedClient

		return {
			statedChannels: {
				...state.statedChannels,
				[payload.channelId]: {
					...channel,
					clients: newClients,
				},
			},
		}
	})
}
