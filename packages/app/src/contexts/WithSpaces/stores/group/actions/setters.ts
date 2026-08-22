import type { SetGroupState, GetGroupState } from "./context"

export const createSetters = (set: SetGroupState, get: GetGroupState) => ({
	setData: (data: any) => {
		set({ data })
	},

	setChannels: (updater: any) => {
		set((state) => ({
			channels:
				typeof updater === "function"
					? updater(state.channels)
					: updater,
		}))
	},

	setMembers: (updater: any) => {
		set((state) => ({
			members:
				typeof updater === "function"
					? updater(state.members)
					: updater,
		}))
	},

	setConnectedMembers: (updater: any) => {
		set((state) => ({
			connectedMembers:
				typeof updater === "function"
					? updater(state.connectedMembers)
					: updater,
		}))
	},
})
