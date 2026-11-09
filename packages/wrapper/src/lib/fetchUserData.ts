import type { ComtyUser } from "../types"

const API_BASE_URL = "https://api.comty.app"
const REQUEST_TIMEOUT_MS = 10_000

export default async function fetchUserData(
	username: string,
): Promise<ComtyUser> {
	if (typeof username !== "string" || username.length === 0) {
		throw new Error("Invalid or missing username")
	}

	const resolveResponse = await fetch(
		`${API_BASE_URL}/users/${encodeURIComponent(username)}/resolve-user_id`,
		{ signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
	)

	if (!resolveResponse.ok) {
		throw new Error(`Failed to resolve user id: ${resolveResponse.status}`)
	}

	const { user_id: userId } = (await resolveResponse.json()) as {
		user_id?: string
	}

	if (!userId) {
		throw new Error(`User not found: ${username}`)
	}

	const dataResponse = await fetch(
		`${API_BASE_URL}/users/${encodeURIComponent(userId)}/data?basic=true`,
		{ signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
	)

	if (!dataResponse.ok) {
		throw new Error(`Failed to fetch user data: ${dataResponse.status}`)
	}

	return (await dataResponse.json()) as ComtyUser
}
