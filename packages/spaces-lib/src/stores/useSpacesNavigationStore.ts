import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { SpacesNavigationStoreType } from "./navigation/types"
import { createActions } from "./navigation/actions/navigate"
import { syncToUrl } from "./navigation/urlHelpers"

export const useSpacesNavigationStore = create<SpacesNavigationStoreType>()(
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

useSpacesNavigationStore.subscribe((state, prevState) => {
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

export const useSpacesNavigation = () =>
	useSpacesNavigationStore(
		useShallow((s) => ({
			firstLoad: s.firstLoad,
			type: s.type,
			room: s.room,
			channel: s.channel,
			subview: s.subview,
			navigate: s.actions.navigate,
			headerContent: s.headerContent,
			registerHeaderContent: s.actions.registerHeaderContent,
			unregisterHeaderContent: s.actions.unregisterHeaderContent,
		})),
	)

export const useNavigationActions = () =>
	useSpacesNavigationStore((s) => s.actions)
