import { EventsUpdaters } from ".."

export interface ClientVoiceChannelLeftPayload {
	channelId: string
	userId: string
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: ClientVoiceChannelLeftPayload,
): void => {
	updaters.setStatedChannels((prev) => {
		if (!prev[payload.channelId]) {
			return prev
		}

		prev[payload.channelId].clients = prev[
			payload.channelId
		].clients.filter((client) => {
			if (client.userId === payload.userId) {
				return false
			}

			return true
		})

		return prev
	})
}
