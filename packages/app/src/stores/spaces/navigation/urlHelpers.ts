import type { NavigationStoreType, NavigationType } from "./types"

import { URL_PREFIX, RESERVED_SUBVIEWS } from "./constants"

export function composePathname({
	type,
	room,
	channel,
	subview,
}: Partial<NavigationStoreType>): string {
	const parts: (string | null)[] = [URL_PREFIX, type ?? null, room ?? null]

	if (subview && !channel) {
		parts.push(subview)
	} else {
		parts.push(channel ?? null)
		parts.push(subview ?? null)
	}

	return "/" + parts.filter((part) => part != null).join("/")
}

export function parseUrlParts(pathname?: string): Partial<NavigationStoreType> {
	const parts = (pathname ?? getCurrentPath()).split("/").filter(Boolean)
	const [prefix, rawType, rawRoom, rawChannel, rawSubview] = parts

	if (prefix !== URL_PREFIX) {
		return {
			type: null,
			room: null,
			channel: null,
			subview: null,
		}
	}

	const resolvedChannel =
		rawChannel && RESERVED_SUBVIEWS.has(rawChannel) ? null : rawChannel || null

	const resolvedSubview =
		rawChannel && RESERVED_SUBVIEWS.has(rawChannel)
			? rawChannel
			: rawSubview || null

	const type: NavigationType =
		rawType === "group" || rawType === "dm" ? rawType : null

	return {
		type,
		room: rawRoom || null,
		channel: resolvedChannel,
		subview: resolvedSubview,
	}
}

export function getCurrentPath(): string {
	const path =
		app.location?.pathname ||
		(app.isDesktop
			? window.location.hash.replace(/^#/, "")
			: window.location.pathname)

	if (!path) return "/"

	return path.length > 1 ? path.replace(/\/$/, "") : path
}

export function syncToUrl(
	state: Partial<NavigationStoreType>,
	{ replace = false }: { replace?: boolean } = {},
) {
	const pathname = composePathname(state)

	// the url is already in sync, avoid duplicate history entries
	if (getCurrentPath() === pathname) return

	const method = replace ? "replace" : "push"

	if (typeof app.location?.[method] === "function") {
		return app.location[method](pathname)
	}

	if (app.isDesktop) {
		window.location.hash = `#${pathname}`
	} else if (replace) {
		history.replaceState(undefined, "", pathname)
	} else {
		history.pushState(undefined, "", pathname)
	}
}
