import type EventsActions from "../index"

export default function (
	this: EventsActions,
	payload: { channelId: string },
): void {
	this.setState((state) => {
		const { [payload.channelId]: _removed, ...rest } = state.statedChannels

		return { statedChannels: rest }
	})
}
