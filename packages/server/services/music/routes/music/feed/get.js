import { MusicRelease } from "@db_models"

export default async (req) => {
	const { limit = 10, page = 0, order = "desc" } = req.query

	const searchQuery = {}

	const total_length = await MusicRelease.countDocuments(searchQuery)

	const trim = limit * page

	let result = await MusicRelease.find({
		...searchQuery,
		public: true,
	})
		.limit(limit)
		.skip(trim)
		.sort({ created_at: order === "desc" ? -1 : 1 })

	return {
		total_length: total_length,
		has_more: total_length > trim + limit,
		items: result,
	}
}
