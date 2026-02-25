import * as cheerio from "cheerio"
import fetchUserData from "@lib/fetchUserData"

export default {
	useContexts: ["lru"],
	useMiddlewares: ["onlyBots"],
	fn: async (req, res, ctx) => {
		try {
			const { username } = req.params
			const cacheKey = `og-user-${username}`

			let user = null

			if (ctx.lru.has(cacheKey)) {
				user = ctx.lru.get(cacheKey)
			} else {
				user = await fetchUserData(username)
				ctx.lru.set(cacheKey, user)
			}

			if (!user) {
				return res.send(req.indexHtml)
			}

			const page = cheerio.load(req.indexHtml)

			page('meta[property="og:title"]').attr(
				"content",
				`@${user.username} on Comty™`,
			)
			page('meta[property="og:description"]').attr(
				"content",
				user.description,
			)
			page('meta[property="og:image"]').attr(
				"content",
				(req.headers["x-forwarded-proto"] || req.protocol) +
					"://" +
					(req.headers["x-forwarded-host"] || req.get("host")) +
					req.url +
					"/og-img.png",
			)
			page('meta[property="og:url"]').attr(
				"content",
				`https://comty.app/account/${username}`,
			)

			page('meta[property="og:site_name"]').attr("content", "Comty™")
			page('meta[property="og:type"]').attr("content", "website")
			page("meta[name='twitter:card']").attr(
				"content",
				"summary_large_image",
			)

			res.send(page.html())
		} catch (error) {
			console.error(error)
			res.send(req.indexHtml)
		}
	},
}
