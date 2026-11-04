import type { SetNavState, GetNavState } from "./context"
import type { NavigationOptions } from "../types"

import { parseUrlParts, syncToUrl } from "../urlHelpers"

export const createActions = (set: SetNavState, get: GetNavState) => ({
	navigate: (update: any, options?: NavigationOptions) => {
		const next = { ...get(), ...update }

		set(update)
		syncToUrl(next, options)
	},

	registerHeaderContent: (fn: any) => {
		set({
			headerContent: typeof fn === "function" ? fn : null,
		})
	},

	unregisterHeaderContent: () => {
		set({ headerContent: null })
	},

	initFromUrl: (pathname?: string) => {
		set(parseUrlParts(pathname))
	},
})
