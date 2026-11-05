// errors raised by the sfu when the router, transport, producer or consumer
// of a session no longer exists. they mean the media session was lost, not
// that the request was invalid
const STALE_RESOURCE_PATTERN =
	/^(router|transport|producer|consumer) \[[^\]]*\] not found$/i
const STALE_ROUTER_PATTERN = /^router \[[^\]]*\] not found$/i

function staleMessage(error: any): string | null {
	if (!error) return null
	if (Number(error.code) !== 404) return null

	return String(error.message ?? "").trim()
}

export function isStaleMediaSessionError(error: any): boolean {
	const message = staleMessage(error)

	return !!message && STALE_RESOURCE_PATTERN.test(message)
}

// a missing router means the whole session is gone, every other resource
// belongs to a single client and must not take the channel down
export function isStaleRouterError(error: any): boolean {
	const message = staleMessage(error)

	return !!message && STALE_ROUTER_PATTERN.test(message)
}

export default isStaleMediaSessionError
