import { EventsUpdaters } from ".."
import { Group } from "../../collections/group"

export interface ClientVoiceChannelProducerOpenPayload {
	channelId: string
	producer: any
}

export default (
	group: Group,
	updaters: EventsUpdaters,
	payload: ClientVoiceChannelProducerOpenPayload,
): void => {
	updaters.setChannels((prev) => {
		const channels = prev.items.map((channel) => {
			if (!channel.producers) {
				channel.producers = []
			}
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				channel.producers.push(payload.producer)
			}

			return channel
		})

		return {
			...prev,
			items: channels,
		}
	})
}
