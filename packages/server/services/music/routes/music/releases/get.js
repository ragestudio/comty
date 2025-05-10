import { MusicRelease } from "@db_models"

export default async (req) => {
	const { limit = 50, page = 0, user_id } = req.query

	const trim = limit * page

	const query = {
		public: true,
	}

	if (user_id) {
		query.user_id = user_id
	}

	const total_items = await MusicRelease.countDocuments(query)

	const items = await MusicRelease.find(query)
		.limit(limit)
		.skip(trim)
		.sort({ _id: -1 })

	return {
		total_items: total_items,
		items: items,
	}
}
