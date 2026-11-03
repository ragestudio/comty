import UserModel from "@db_models/user"

// the realtime layer only needs these fields, keeping them small also keeps
// the serialized channel state stored in the kv bucket small
export type ClientUser = {
	_id: string
	username?: string | null
	avatar?: string | null
	public_name?: string | null
}

const CACHE_PREFIX = "user:profile:"
const CACHE_TTL_SECONDS = 300

export function normalizeClientUser(user: any): ClientUser | null {
	if (!user) return null

	const id = user._id ?? user.id

	if (!id) return null

	return {
		_id: String(id),
		username: user.username ?? null,
		avatar: user.avatar ?? null,
		public_name: user.public_name ?? null,
	}
}

// identity always comes from the gateway headers, the profile is optional
export function getClientUserId(client: any): string | null {
	return (
		client?.userId ??
		client?.context?.userId ??
		client?.context?.user_id ??
		client?.context?.user?._id ??
		null
	)
}

// reads the profile already attached to the client, either by the gateway
// or by a previous hydration
export function getClientUser(client: any): ClientUser | null {
	return (
		normalizeClientUser(client?.user) ??
		normalizeClientUser(client?.context?.user) ??
		null
	)
}

// resolves a client profile from the user id, using a shared cache so every
// service instance gets the same data without keeping local state
export async function resolveClientUser(
	client: any,
	redis?: any,
): Promise<ClientUser | null> {
	const userId = getClientUserId(client)
	const current = getClientUser(client)

	// the gateway already provided a complete profile
	if (current?.username) {
		return current
	}

	if (!userId) {
		return current
	}

	const cacheKey = `${CACHE_PREFIX}${userId}`

	if (redis) {
		try {
			const cached = await redis.get(cacheKey)

			if (cached) {
				const parsed = JSON.parse(cached)

				if (parsed?.username) return parsed
			}
		} catch (error) {
			console.error("failed to read user profile cache", error)
		}
	}

	let resolved: ClientUser | null = null

	try {
		const user = await UserModel.findById(userId, {
			username: 1,
			avatar: 1,
			public_name: 1,
		}).lean()

		resolved = normalizeClientUser(user)
	} catch (error) {
		console.error(`failed to resolve user profile [${userId}]`, error)
	}

	const profile = resolved ?? current ?? { _id: userId }

	if (redis && resolved) {
		redis
			.set(cacheKey, JSON.stringify(resolved), "EX", CACHE_TTL_SECONDS)
			.catch((error) => {
				console.error("failed to cache user profile", error)
			})
	}

	return profile
}

// stores the resolved profile in the client context so later reads are local
export async function hydrateClientUser(
	client: any,
	redis?: any,
): Promise<ClientUser | null> {
	const profile = await resolveClientUser(client, redis)

	if (!profile) return null

	if (!client.context) {
		client.context = {}
	}

	client.context.user = profile
	client.context.userId = profile._id

	// local clients keep a plain userId property, the nats proxy reads it
	// from the context we just updated
	if (!client.userId) {
		try {
			client.userId = profile._id
		} catch (_error) {
			// userId is read only on the nats client proxy
		}
	}

	return profile
}

export default resolveClientUser
