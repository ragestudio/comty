import { EventsUpdaters } from ".."

export interface ClientVoiceChannelProducerClosePayload {
	channelId: string
	producer: {
		id: string
		[key: string]: any
	}
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: ClientVoiceChannelProducerClosePayload,
): void => {
	updaters.setStatedChannels((prev) => {
		if (!prev[payload.channelId]) {
			return prev
		}

		prev[payload.channelId].producers = prev[
			payload.channelId
		].producers.filter((producer) => producer.id !== payload.producer.id)

		return prev
	})
}
