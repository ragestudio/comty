import { FeaturedWallpaper } from "@db_models"

export default async (req) => {
	let {
		limit = 10,
		offset = 0,
		random = false,
		includeDisabled = false,
	} = req.query

	if (random) {
		const items = await FeaturedWallpaper.countDocuments({ active: true })

		offset = Math.floor(Math.random() * items)

		const wallapers = await FeaturedWallpaper.find({ active: true })
			.skip(offset)
			.limit(1)
		return wallapers[0]
	}

	const query = {
		active: true,
	}

	if (includeDisabled === true) {
		delete query.active
	}

	const wallapers = await FeaturedWallpaper.find(query)
		.skip(offset)
		.limit(limit)

	return wallapers
}
