import type EventsActions from "../index"

export default function (
	this: EventsActions,
	payload: { channelId: string; started_at?: string },
): void {
	this.setState((state) => {
		const existing = state.statedChannels[payload.channelId]

		return {
			statedChannels: {
				...state.statedChannels,
				[payload.channelId]: {
					_id: payload.channelId,
					clients: existing?.clients ?? [],
					producers: existing?.producers ?? [],
					started_at: payload.started_at,
				},
			},
		}
	})
}
