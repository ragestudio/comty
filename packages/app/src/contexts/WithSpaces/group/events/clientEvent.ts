import { EventsUpdaters } from ".."
import { Group } from "../../collections/group"

export interface ClientEventPayload {
	event: string
	channelId: string
	userId: string
	data: any
}

export default (
	group: Group,
	updaters: EventsUpdaters,
	payload: ClientEventPayload,
): void => {
	switch (payload.event) {
		case "updateVoiceState":
			updaters.setChannels((prev) => {
				const channelIndex = prev.items.findIndex(
					(channel) => channel._id === payload.channelId,
				)
				const clientIndex =
					channelIndex > -1
						? prev.items[channelIndex].clients.findIndex(
								(client) => client.userId === payload.userId,
							)
						: -1

				if (clientIndex === -1) {
					return prev
				}

				const client = prev[channelIndex].clients[clientIndex]

				prev.items = prev.items.with(channelIndex, {
					...prev[channelIndex],
					clients: prev[channelIndex].clients.with(clientIndex, {
						...client,
						voiceState: { ...client.voiceState, ...payload.data },
					}),
				})

				return prev
			})
			break
	}
}
