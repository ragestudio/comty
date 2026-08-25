import type EventsActions from "../index"

export default function (
	this: EventsActions,
	payload: { userId: string },
): void {
	this.setState((state) => {
		if (!state.connectedMembers.includes(payload.userId)) {
			return state
		}

		return {
			connectedMembers: state.connectedMembers.filter(
				(id) => id !== payload.userId,
			),
		}
	})
}
