export type NavigationType = "group" | "dm" | null

export interface SpacesNavigationState {
	firstLoad: boolean
	type: NavigationType
	room: string | null
	channel: string | null
	subview: string | null
	headerContent: (() => any) | null
}

export interface SpacesNavigationActions {
	navigate: (
		update: Partial<
			Pick<SpacesNavigationState, "type" | "room" | "channel" | "subview">
		>,
	) => void
	registerHeaderContent: (fn: (() => any) | null) => void
	unregisterHeaderContent: () => void
	initFromUrl: () => void
}

export type SpacesNavigationStoreType = SpacesNavigationState & {
	actions: SpacesNavigationActions
}
