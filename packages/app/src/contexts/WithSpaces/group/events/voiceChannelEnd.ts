import { EventsUpdaters } from ".."

export interface VoiceChannelEndedPayload {
	channelId: string
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: VoiceChannelEndedPayload,
): void => {
	console.log("vc:end", payload)

	updaters.setStatedChannels((prev) => {
		const nw = { ...prev }

		if (nw[payload.channelId]) {
			delete nw[payload.channelId]
		}

		return nw
	})
}
