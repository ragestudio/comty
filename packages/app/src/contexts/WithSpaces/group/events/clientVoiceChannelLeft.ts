import { EventsUpdaters } from ".."
import { Group } from "../../collections/group"

export interface ClientVoiceChannelLeftPayload {
	channelId: string
	userId: string
}

export default (
	group: Group,
	updaters: EventsUpdaters,
	payload: ClientVoiceChannelLeftPayload,
): void => {
	updaters.setChannels((prev) => {
		const channels = prev.items.map((channel) => {
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				channel.clients = channel.clients.filter(
					(client) => client.userId !== payload.userId,
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
