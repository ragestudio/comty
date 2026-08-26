import type { SetNavState, GetNavState } from "./context"
import { parseUrlParts } from "../urlHelpers"

export const createActions = (set: SetNavState, get: GetNavState) => ({
	navigate: (update: any) => {
		set(update)
	},

	registerHeaderContent: (fn: any) => {
		set({
			headerContent: typeof fn === "function" ? fn : null,
		})
	},

	unregisterHeaderContent: () => {
		set({ headerContent: null })
	},

	initFromUrl: () => {
		const parsed = parseUrlParts()

		set({
			...(parsed.type !== undefined ? { type: parsed.type } : {}),
			...(parsed.room !== undefined ? { room: parsed.room } : {}),
			...(parsed.channel !== undefined
				? { channel: parsed.channel }
				: {}),
			...(parsed.subview !== undefined
				? { subview: parsed.subview }
				: {}),
			firstLoad: false,
		})
	},
})
