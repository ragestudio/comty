import type { NavigationStoreType } from "./types"

import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { createActions } from "./actions/navigate"
import { syncToUrl } from "./urlHelpers"

export const SpacesNavigationStore = create<NavigationStoreType>()(
	(set, get) => ({
		firstLoad: true,
		type: null,
		room: null,
		channel: null,
		subview: null,
		headerContent: null,

		actions: {
			...createActions(set, get),
		},
	}),
)

SpacesNavigationStore.subscribe((state, prevState) => {
	if (state.firstLoad) return

	if (
		state.type === prevState.type &&
		state.room === prevState.room &&
		state.channel === prevState.channel &&
		state.subview === prevState.subview
	) {
		return
	}

	syncToUrl(state)
})

export const useSpacesNavigation = () => SpacesNavigationStore((s) => s)

export default useSpacesNavigation

// export const useNavigationActions = () =>
// 	SpacesNavigationStore((s) => s.actions)
