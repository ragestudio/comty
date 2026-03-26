import { EventsUpdaters } from ".."

export interface ClientEventPayload {
	event: string
	channelId: string
	userId: string
	data: any
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: ClientEventPayload,
): void => {
	switch (payload.event) {
		case "updateVoiceState":
			updaters.setStatedChannels((prev) => {
				if (!prev[payload.channelId]) {
					return prev
				}

				const nw = { ...prev }

				const clientIndex = nw[payload.channelId].clients.findIndex(
					(client) => client.userId === payload.userId,
				)

				if (clientIndex === -1) {
					return prev
				}

				const client = nw[payload.channelId].clients[clientIndex]

				nw[payload.channelId].clients = nw[
					payload.channelId
				].clients.with(clientIndex, {
					...client,
					voiceState: { ...client.voiceState, ...payload.data },
				})

				return nw
			})

			break
	}
}
