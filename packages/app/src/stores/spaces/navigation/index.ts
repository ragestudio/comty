import type { NavigationStoreType } from "./types"

import React from "react"
import { useLocation } from "react-router"
import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { createActions } from "./actions/navigate"

export const SpacesNavigationStore = create<NavigationStoreType>()(
	(set, get) => ({
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

export const useSpacesNavigation = () => SpacesNavigationStore((s) => s)

export default useSpacesNavigation

/**
 * Keeps the spaces navigation store in sync with the current route.
 * The url is the source of truth, pages must not hydrate it manually.
 */
export const useSpacesRouteSync = () => {
	const { actions } = useSpacesNavigation()
	const location = useLocation()

	React.useEffect(() => {
		actions.initFromUrl(location.pathname)
	}, [actions, location.pathname])
}
