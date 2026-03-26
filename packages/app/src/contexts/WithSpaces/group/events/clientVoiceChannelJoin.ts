import { EventsUpdaters } from ".."
import { Group } from "../../collections/group"

export interface ClientVoiceChannelJoinPayload {
	channelId: string
	userId: string
	user: any
	voiceState: any
}

export default (
	group: Group,
	updaters: EventsUpdaters,
	payload: ClientVoiceChannelJoinPayload,
): void => {
	updaters.setChannels((prev) => {
		const channels = prev.items.map((channel) => {
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				channel.clients.push({
					userId: payload.userId,
					user: payload.user,
					voiceState: payload.voiceState,
					self: payload.userId === app.userData._id,
				})
			}

			return channel
		})

		return {
			...prev,
			items: channels,
		}
	})
}
