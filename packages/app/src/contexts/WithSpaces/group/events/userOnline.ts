import { EventsUpdaters } from ".."
import { Group } from "../../collections/group"

export interface UserOnlinePayload {
	userId: string
}

export default (
	group: Group,
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
