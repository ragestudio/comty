import type { ComtyPost } from "../types"

const API_BASE_URL = "https://api.comty.app"
const REQUEST_TIMEOUT_MS = 10_000

export default async function fetchPostData(
	postId: string,
): Promise<ComtyPost> {
	if (typeof postId !== "string" || postId.length === 0) {
		throw new Error("Invalid or missing post id")
	}

	const response = await fetch(
		`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/data`,
		{ signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
	)

	if (!response.ok) {
		throw new Error(`Failed to fetch post data: ${response.status}`)
	}

	return (await response.json()) as ComtyPost
}
