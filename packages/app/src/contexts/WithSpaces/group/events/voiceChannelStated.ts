import { EventsUpdaters } from ".."
import { Group } from "../../collections/group"

export interface VoiceChannelStartedPayload {
	channelId: string
	started_at?: string
}

export default (
	group: Group,
	updaters: EventsUpdaters,
	payload: VoiceChannelStartedPayload,
): void => {
	updaters.setChannels((prev) => {
		const channels = prev.items.map((channel) => {
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				if (payload.started_at) {
					channel.started_at = payload.started_at
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
