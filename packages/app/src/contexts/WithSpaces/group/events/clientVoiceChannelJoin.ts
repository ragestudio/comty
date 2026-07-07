import { EventsUpdaters } from ".."
import { Client } from "../../collections/client"

export interface ClientVoiceChannelJoinPayload {
	channelId: string
	userId: string
	user: any
	voiceState: any
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: ClientVoiceChannelJoinPayload,
): void => {
	updaters.setStatedChannels((prev) => {
		const client: Client = {
			channel_id: payload.channelId,
			userId: payload.userId,
			user: payload.user,
			voiceState: payload.voiceState,
			self: payload.userId === app.userData._id,
		}

		if (!prev[payload.channelId]) {
			prev[payload.channelId] = {
				_id: payload.channelId,
				clients: [],
				producers: [],
			}
		}

		if (
			!prev[payload.channelId].clients.some(
				(c) => c.userId === payload.userId,
			)
		) {
			prev[payload.channelId].clients.push(client)
		}

		return prev
	})
}
