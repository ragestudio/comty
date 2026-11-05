import type EventsActions from "../index"

export default function (
	this: EventsActions,
	payload: { userId: string },
): void {
	// keep the reference cache in sync so a later read does not revert it
	this.state.userConnections.set(payload.userId, { connected: true })

	this.setState((state) => {
		if (state.connectedMembers.includes(payload.userId)) {
			return state
		}

		return {
			connectedMembers: [...state.connectedMembers, payload.userId],
		}
	})

	this.state.actions.evaluateDecorations([payload.userId])
}
