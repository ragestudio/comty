import type EventsActions from "../index"
import type { GroupUpdatePayload } from "../../../../stores/group/types"

import db from "../../../../db"

export default function (
	this: EventsActions,
	payload: GroupUpdatePayload,
): void {
	this.setState((state) => {
		if (!state.data || state.data._id !== payload._id) {
			return state
		}

		const updatedGroup = { ...state.data, ...payload }

		db.groups.put(updatedGroup).catch((err) => {
			console.error("Failed to update group in cache", err)
		})

		return { data: updatedGroup }
	})
}
