import type { SetGroupState, GetGroupState } from "./context"

export const createPresenceEvents = (
	set: SetGroupState,
	get: GetGroupState,
) => ({
	handleUserOnline: (payload: { userId: string }) => {
		set((state) => {
			if (state.connectedMembers.includes(payload.userId)) {
				return state
			}
			return {
				connectedMembers: [...state.connectedMembers, payload.userId],
			}
		})
	},

	handleUserOffline: (payload: { userId: string }) => {
		set((state) => {
			if (!state.connectedMembers.includes(payload.userId)) {
				return state
			}
			return {
				connectedMembers: state.connectedMembers.filter(
					(id) => id !== payload.userId,
				),
			}
		})
	},
})
