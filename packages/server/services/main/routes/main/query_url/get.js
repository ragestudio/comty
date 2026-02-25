export default {
	useContexts: ["redis"],
	fn: async (req, res, ctx) => {
		const ioredis = ctx.redis.client
		const url = req.query.url

		const cacheKey = `headers:${Buffer.from(url).toString("base64")}`

		const cachedHeaders = await ioredis.get(cacheKey)

		if (cachedHeaders && !req.query.ignore_cache) {
			res.header("Cache-Control", "public, max-age=3600")

			return {
				ok: true,
				remoteHeaders: JSON.parse(cachedHeaders),
				fromCache: true,
			}
		}

		const remoteHeaders = await fetch(url, {
			method: "HEAD",
			headers: {
				"User-Agent":
					"Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ComtyCrawlerBot/1.0;",
			},
		}).then((res) => res.headers)

		const headersObj = Object.fromEntries(remoteHeaders.entries())

		await ioredis.setex(cacheKey, 3600, JSON.stringify(headersObj))

		res.header("Cache-Control", "public, max-age=3600")

		return {
			remoteHeaders: headersObj,
			fromCache: false,
		}
	},
}
