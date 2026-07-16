import React from "react"

const URL_PREFIX = "spaces"
const RESERVED_SUBVIEWS = new Set(["settings", "members"])

export type NavigationType = "group" | "dm" | null

export type SpacesNavigationState = {
	firstLoad: boolean
	type: NavigationType
	room: string | null
	channel: string | null
	subview: string | null
}

export type SpacesNavigationActions = {
	navigate: (
		update: Partial<
			Pick<SpacesNavigationState, "type" | "room" | "channel" | "subview">
		>,
	) => void
	headerContent: (() => React.ReactNode) | null
	registerHeaderContent: (fn: (() => React.ReactNode) | null) => void
	unregisterHeaderContent: () => void
}

export type SpacesNavigationContextType = SpacesNavigationState &
	SpacesNavigationActions

const DEFAULT_CONTEXT_DATA: SpacesNavigationContextType = {
	firstLoad: true,
	type: null,
	room: null,
	channel: null,
	subview: null,
	navigate: () => {},
	headerContent: null,
	registerHeaderContent: () => {},
	unregisterHeaderContent: () => {},
}

export const SpacesNavigationContext =
	React.createContext<SpacesNavigationContextType>(DEFAULT_CONTEXT_DATA)

const composePathname = ({
	type,
	room,
	channel,
	subview,
}: Partial<SpacesNavigationState>): string => {
	const parts: (string | null)[] = [URL_PREFIX, type, room]

	if (subview && !channel) {
		parts.push(subview)
	} else {
		parts.push(channel)
		parts.push(subview)
	}

	return "/" + parts.filter((p) => p != null).join("/")
}

const parseUrlParts = (): Partial<SpacesNavigationState> => {
	let parts: string[] = []

	if ((window as any).app?.isDesktop) {
		const hashParts = window.location.hash.replace("#", "").split("/")
		parts = hashParts
	} else {
		parts = window.location.pathname.split("/")
	}

	const [, prefix, _type, _room, _channel, _subview] = parts

	if (prefix !== URL_PREFIX) {
		return {}
	}

	const resolvedChannel =
		_channel && RESERVED_SUBVIEWS.has(_channel) ? null : _channel || null

	const resolvedSubview =
		_channel && RESERVED_SUBVIEWS.has(_channel)
			? _channel
			: _subview || null

	return {
		type: (_type as NavigationType) || null,
		room: _room || null,
		channel: resolvedChannel,
		subview: resolvedSubview,
	}
}

export const useSpacesNavigationController =
	(): SpacesNavigationContextType => {
		const [firstLoad, setFirstLoad] = React.useState(true)
		const [type, setType] = React.useState<NavigationType>(null)
		const [room, setRoom] = React.useState<string | null>(null)
		const [channel, setChannel] = React.useState<string | null>(null)
		const [subview, setSubview] = React.useState<string | null>(null)

		const [headerContent, setHeaderContent] = React.useState<
			(() => React.ReactNode) | null
		>(null)

		const registerHeaderContent = React.useCallback(
			(fn: (() => React.ReactNode) | null) => {
				setHeaderContent(typeof fn === "function" ? () => fn : null)
			},
			[],
		)

		const unregisterHeaderContent = React.useCallback(() => {
			setHeaderContent(null)
		}, [])

		// write current state to browser history
		const updateToHistory = React.useCallback(() => {
			const pathname = composePathname({
				type,
				room,
				channel,
				subview,
			})

			if ((window as any).app?.isDesktop) {
				window.location.hash = `#${pathname}`
			} else {
				history.pushState(undefined, "", pathname)
			}
		}, [type, room, channel, subview])

		// read url and update state
		const updateFromHistory = React.useCallback(() => {
			const parsed = parseUrlParts()

			setType((prev) => (parsed.type !== undefined ? parsed.type : prev))
			setRoom((prev) => (parsed.room !== undefined ? parsed.room : prev))
			setChannel((prev) =>
				parsed.channel !== undefined ? parsed.channel : prev,
			)
			setSubview((prev) =>
				parsed.subview !== undefined ? parsed.subview : prev,
			)
		}, [])

		// listen to browser back/forward
		React.useEffect(() => {
			updateFromHistory()
			setFirstLoad(false)
			window.addEventListener("popstate", updateFromHistory)
			return () =>
				window.removeEventListener("popstate", updateFromHistory)
		}, [updateFromHistory])

		// sync state changes to url (skip first load to avoid double push)
		React.useEffect(() => {
			if (!firstLoad) {
				updateToHistory()
			}
		}, [type, room, channel, subview, firstLoad, updateToHistory])

		const navigate = React.useCallback(
			(
				update: Partial<
					Pick<
						SpacesNavigationState,
						"type" | "room" | "channel" | "subview"
					>
				>,
			) => {
				if (update.type !== undefined) setType(update.type)
				if (update.room !== undefined) setRoom(update.room)
				if (update.channel !== undefined) setChannel(update.channel)
				if (update.subview !== undefined) setSubview(update.subview)
			},
			[],
		)

		return {
			firstLoad,
			type,
			room,
			channel,
			subview,
			navigate,
			headerContent,
			registerHeaderContent,
			unregisterHeaderContent,
		}
	}

export const useSpacesNavigation = (): SpacesNavigationContextType => {
	return React.useContext(SpacesNavigationContext)
}

export default SpacesNavigationContext
