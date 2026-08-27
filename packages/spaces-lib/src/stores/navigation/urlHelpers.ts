import type { NavigationStoreType, NavigationType } from "./types"

import { URL_PREFIX, RESERVED_SUBVIEWS } from "./constants"
import isDesktop from "../../utils/isDesktop"

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

	return "/" + parts.filter((p) => p != null).join("/")
}

export function parseUrlParts(): Partial<NavigationStoreType> {
	let parts: string[] = []

	if (isDesktop()) {
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

export function syncToUrl(state: Partial<NavigationStoreType>) {
	const pathname = composePathname(state)

	if (isDesktop()) {
		window.location.hash = `#${pathname}`
	} else {
		history.pushState(undefined, "", pathname)
	}
}
