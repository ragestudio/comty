import type { SetGroupState, GetGroupState } from "./context"
import type { GroupUpdatePayload } from "../types"

import db from "../../../store"

export const createGroupEvents = (set: SetGroupState, get: GetGroupState) => ({
	handleGroupUpdate: (payload: GroupUpdatePayload) => {
		set((state) => {
			if (!state.data || state.data._id !== payload._id) {
				return state
			}

			const updatedGroup = { ...state.data, ...payload }

			db.groups.put(updatedGroup).catch((err) => {
				console.error("Failed to update group in cache", err)
			})

			return { data: updatedGroup }
		})
	},
})
