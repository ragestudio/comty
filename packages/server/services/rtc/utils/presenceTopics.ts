export const MAX_PRESENCE_SUBSCRIPTIONS = 128

type PresencePayload =
	| { userIds?: unknown }
	| string
	| string[]
	| null
	| undefined

/**
 * Turns a presence subscription payload into a bounded list of topics, one
 * per watched user. Ids can arrive as an array or a comma separated string.
 */
export function resolvePresenceTopics(payload: PresencePayload): string[] {
	const fromObject = (payload as any)?.userIds

	const input = Array.isArray(payload)
		? payload
		: typeof payload === "string"
			? payload.split(",")
			: Array.isArray(fromObject)
				? fromObject
				: typeof fromObject === "string"
					? fromObject.split(",")
					: []

	const topics = new Set<string>()

	for (const raw of input) {
		const id = typeof raw === "string" ? raw.trim() : ""

		// "0" is the system user, never present
		if (id === "" || id === "0") continue

		topics.add(`presence:user:${id}`)

		if (topics.size >= MAX_PRESENCE_SUBSCRIPTIONS) break
	}

	return Array.from(topics)
}
