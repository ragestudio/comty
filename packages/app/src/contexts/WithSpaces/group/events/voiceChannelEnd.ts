import { EventsUpdaters } from ".."
import { Group } from "../../collections/group"

export interface VoiceChannelEndedPayload {
	channelId: string
}

export default (
	group: Group,
	updaters: EventsUpdaters,
	payload: VoiceChannelEndedPayload,
): void => {
	updaters.setChannels((prev) => {
		const channels = prev.items.map((channel) => {
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				if (channel.started_at) {
					delete channel.started_at
				}
			}

			return channel
		})

		return {
			...prev,
			items: channels,
		}
	})
}
