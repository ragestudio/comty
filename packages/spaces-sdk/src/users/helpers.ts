import type { SpacesUser, UserIdInput } from "./types"

// sentinel ids used by system messages and bots, they never resolve to a user
const INVALID_USER_IDS = new Set(["0", "null", "undefined"])

export function normalizeIds(input: UserIdInput): string[] {
	if (!input) return []

	const values =
		typeof input === "string" ? input.split(",") : Array.from(input)
	const ids = new Set<string>()

	for (const value of values) {
		if (typeof value !== "string") continue

		const id = value.trim()

		if (id && !INVALID_USER_IDS.has(id)) ids.add(id)
	}

	return Array.from(ids)
}

export function idsKey(input: UserIdInput): string {
	return normalizeIds(input).join(",")
}

function sameValue(left: unknown, right: unknown): boolean {
	if (Object.is(left, right)) return true

	if (!left || !right) return false

	if (typeof left !== "object" || typeof right !== "object") return false

	try {
		return JSON.stringify(left) === JSON.stringify(right)
	} catch {
		return false
	}
}

// avoids store updates when the api returns the same profile again
// the cache timestamp is ignored because it always changes
function isSameUser(left: SpacesUser, right: SpacesUser): boolean {
	const keys = new Set([...Object.keys(left), ...Object.keys(right)])

	for (const key of keys) {
		if (key === "cached_at") continue

		if (!sameValue((left as any)[key], (right as any)[key])) return false
	}

	return true
}

// keep the previous values when the incoming object does not define a field,
// this way partial payloads never remove data we already know
export function mergeUser(
	current: SpacesUser | undefined,
	incoming: SpacesUser,
	cachedAt: number,
): SpacesUser {
	const next = { ...(current ?? {}) } as SpacesUser
	const target = next as Record<string, any>

	for (const [key, value] of Object.entries(incoming)) {
		if (value === undefined) continue

		// hydrated decorations are handled by the decorations endpoint
		if (key === "decorations") continue

		target[key] = value
	}

	next._id = String(incoming._id ?? current?._id)
	next.cached_at = cachedAt

	return next
}

export { isSameUser }
