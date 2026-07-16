import { EventsUpdaters } from ".."

export interface UserOfflinePayload {
	userId: string
}

export default (
	currentGroupId: string,
	updaters: EventsUpdaters,
	payload: UserOfflinePayload,
): void => {
	console.debug("User switch to offline", payload)

	updaters.setConnectedMembers((prev) => {
		let connected_members = [...prev]

		if (connected_members.includes(payload.userId)) {
			connected_members = connected_members.filter(
				(memberId) => memberId !== payload.userId,
			)
		}

		return connected_members
	})
}
