import { EventsUpdaters } from ".."
import { Group } from "../../collections/group"

export interface ClientVoiceChannelProducerClosePayload {
	channelId: string
	producer: {
		id: string
		[key: string]: any
	}
}

export default (
	group: Group,
	updaters: EventsUpdaters,
	payload: ClientVoiceChannelProducerClosePayload,
): void => {
	updaters.setChannels((prev) => {
		const channels = prev.items.map((channel) => {
			if (!channel.producers) {
				channel.producers = []
			}

			// update the clients of the channel
			if (channel._id === payload.channelId) {
				channel.producers = channel.producers.filter(
					(producer) => producer.id !== payload.producer.id,
				)
			}

			return channel
		})

		return {
			...prev,
			items: channels,
		}
	})
}
