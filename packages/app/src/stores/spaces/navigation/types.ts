export type NavigationType = "group" | "dm" | null

export interface NavigationStoreState {
	firstLoad: boolean
	type: NavigationType
	room: string | null
	channel: string | null
	subview: string | null
	headerContent: (() => any) | null
	actions: NavigationActions
}

export interface NavigationActions {
	navigate: (
		update: Partial<
			Pick<NavigationStoreType, "type" | "room" | "channel" | "subview">
		>,
	) => void
	registerHeaderContent: (fn: (() => any) | null) => void
	unregisterHeaderContent: () => void
	initFromUrl: () => void
}

export type NavigationStoreType = NavigationStoreState & {
	actions: NavigationActions
}
