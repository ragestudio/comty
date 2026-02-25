import * as cheerio from "cheerio"
import fetchPostData from "@lib/fetchPostData"

export default {
	useContexts: ["lru"],
	useMiddlewares: ["onlyBots"],
	fn: async (req, res, ctx) => {
		try {
			const { post_id } = req.params
			const cacheKey = `og-post-${post_id}`

			let post = null

			if (ctx.lru.has(cacheKey)) {
				post = ctx.lru.get(cacheKey)
			} else {
				post = await fetchPostData(post_id)
				ctx.lru.set(cacheKey, post)
			}

			if (!post) {
				return res.send(req.indexHtml)
			}

			if (!post.message) {
				post.message = ""
			}

			// trim max length
			if (post.message.length > 50) {
				post.message = post.message.slice(0, 50)
				post.message += "..."
			}

			const page = cheerio.load(req.indexHtml)

			page('meta[property="og:title"]').attr(
				"content",
				`@${post.user?.username} post on Comty™`,
			)
			page('meta[property="og:description"]').attr(
				"content",
				post.message,
			)
			page('meta[property="og:image"]').attr(
				"content",
				(req.headers["x-forwarded-proto"] || req.protocol) +
					"://" +
					(req.headers["x-forwarded-host"] || req.get("host")) +
					`/account/${post.user?.username}/og-img.png`,
			)
			page('meta[property="og:url"]').attr(
				"content",
				`https://comty.app/post/${post_id}`,
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
