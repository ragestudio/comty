import { EventsUpdaters } from ".."

export interface UserOnlinePayload {
	userId: string
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: UserOnlinePayload,
): void => {
	console.debug("User switch to connected", payload)

	updaters.setConnectedMembers((prev) => {
		const connected_members = [...prev]

		if (!connected_members.includes(payload.userId)) {
			connected_members.push(payload.userId)
		}

		return connected_members
	})
}
