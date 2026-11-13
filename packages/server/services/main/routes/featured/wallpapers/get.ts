import type API from "@services/main/main.service"
import FeaturedWallpaper from "@db_models/featuredWallpaper"

type RouteQuery = {
	limit?: string
	offset?: string
	random?: string
	includeDisabled?: string
}

export default defineRoute<API>()({
	fn: async (req) => {
		const params = req.query as RouteQuery

		let offset = Number(params.offset ?? 0)
		const limit = Number(params.limit ?? 10)

		if (ToBoolean(params.random)) {
			const items = await FeaturedWallpaper.countDocuments({
				active: true,
			})

			offset = Math.floor(Math.random() * items)

			const wallapers = await FeaturedWallpaper.find({ active: true })
				.skip(offset)
				.limit(1)
			return wallapers[0]
		}

		const query: Record<string, any> = {
			active: true,
		}

		if (ToBoolean(params.includeDisabled)) {
			delete query.active
		}

		const wallapers = await FeaturedWallpaper.find(query)
			.skip(offset)
			.limit(limit)

		return wallapers
	},
})
