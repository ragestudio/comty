import GetPostData from "./data"

export default async (payload = {}) => {
	const posts = await GetPostData(payload)

	return posts
}
