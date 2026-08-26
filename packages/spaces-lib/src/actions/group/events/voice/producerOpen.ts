import type EventsActions from "../index"
import type { ProducerOpenPayload } from "../../../../stores/group/types"

export default function (
	this: EventsActions,
	payload: ProducerOpenPayload,
): void {
	this.setState((state) => {
		const channel = state.statedChannels[payload.channelId] ?? {
			_id: payload.channelId,
			clients: [],
			producers: [],
		}

		if (
			channel.producers?.some(
				(p: any) => p.producerId === payload.producer.producerId,
			)
		) {
			return state
		}

		return {
			statedChannels: {
				...state.statedChannels,
				[payload.channelId]: {
					...channel,
					producers: [...(channel.producers ?? []), payload.producer],
				},
			},
		}
	})
}
