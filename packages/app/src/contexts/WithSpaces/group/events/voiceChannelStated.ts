import { EventsUpdaters } from ".."

export interface VoiceChannelStartedPayload {
	channelId: string
	started_at?: string
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: VoiceChannelStartedPayload,
): void => {
	updaters.setStatedChannels((prev) => {
		const nw = { ...prev }

		if (!nw[payload.channelId]) {
			nw[payload.channelId] = {
				_id: payload.channelId,
				clients: [],
				producers: [],
			}
		}

		nw[payload.channelId].started_at = payload.started_at

		return nw
	})
}
