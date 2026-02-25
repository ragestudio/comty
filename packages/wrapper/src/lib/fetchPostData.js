export default async (post_id) => {
	const response = await fetch(`https://api.comty.app/posts/${post_id}/data`)

	if (!response.ok) {
		throw new Error(`Failed to fetch post data: ${response.status}`)
	}

	const data = await response.json()

	return data
}
