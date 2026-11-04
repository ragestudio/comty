export type NavigationType = "group" | "dm" | null

export interface NavigationOptions {
	replace?: boolean
}

export interface NavigationStoreState {
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
		options?: NavigationOptions,
	) => void
	registerHeaderContent: (fn: (() => any) | null) => void
	unregisterHeaderContent: () => void
	initFromUrl: (pathname?: string) => void
}

export type NavigationStoreType = NavigationStoreState & {
	actions: NavigationActions
}
