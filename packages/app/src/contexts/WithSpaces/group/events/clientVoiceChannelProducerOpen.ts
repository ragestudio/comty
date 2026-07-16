import { EventsUpdaters } from ".."

export interface ClientVoiceChannelProducerOpenPayload {
	channelId: string
	producer: any
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: ClientVoiceChannelProducerOpenPayload,
): void => {
	updaters.setStatedChannels((prev) => {
		if (!prev[payload.channelId]) {
			prev[payload.channelId] = {
				_id: payload.channelId,
				clients: [],
				producers: [],
			}
		}

		if (
			!prev[payload.channelId].producers.some(
				(p) => p.producerId === payload.producer.producerId,
			)
		) {
			prev[payload.channelId].producers.push(payload.producer)
		}

		return prev
	})
}
