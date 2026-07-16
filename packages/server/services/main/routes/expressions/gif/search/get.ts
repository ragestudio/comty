import type API from "@services/main/main.service"
import KlipyAPI from "@shared-classes/KlipyAPI"

const CACHE_PREFIX = "klipy:gif:search"
const CACHE_TTL = 3600 // 1 hour

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	useContexts: ["redis"] as const,
	fn: async (req, res, ctx) => {
		const { keywords, limit = 20, page = 0 } = req.query

		if (!keywords) {
			throw new OperationError(400, "keywords is required")
		}

		const normalizedQuery = keywords.trim().toLowerCase()
		const cacheKey = `${CACHE_PREFIX}:${normalizedQuery}`

		try {
			const cached = await ctx.redis.client.get(cacheKey)

			if (cached) {
				return JSON.parse(cached)
			}
		} catch (err) {
			// redis unavailable, fall through to API call
		}

		const results = await KlipyAPI.gif.search({
			query: keywords,
			limit: parseInt(limit),
			page: parseInt(page),
		})

		try {
			await ctx.redis.client.setex(
				cacheKey,
				CACHE_TTL,
				JSON.stringify(results),
			)
		} catch (err) {
			// redis unavailable, results still returned
		}

		return results
	},
})
