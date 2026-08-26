import type EventsActions from "../index"
import type { ProducerClosePayload } from "../../../../stores/group/types"

export default function (
	this: EventsActions,
	payload: ProducerClosePayload,
): void {
	this.setState((state) => {
		const channel = state.statedChannels[payload.channelId]

		if (!channel) return state

		return {
			statedChannels: {
				...state.statedChannels,
				[payload.channelId]: {
					...channel,
					producers: (channel.producers ?? []).filter(
						(p: any) => p.id !== payload.producer.id,
					),
				},
			},
		}
	})
}
