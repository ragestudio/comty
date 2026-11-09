import * as cheerio from "cheerio"

import type WebWrapper from "@/main"
import fetchPostData from "@lib/fetchPostData"
import getRequestOrigin from "@lib/getRequestOrigin"
import type { ComtyPost, WrapperRequest } from "@/types"

const MAX_DESCRIPTION_LENGTH = 50

function truncateDescription(message: string) {
	if (message.length <= MAX_DESCRIPTION_LENGTH) {
		return message
	}

	return `${message.slice(0, MAX_DESCRIPTION_LENGTH)}...`
}

export default defineRoute<WebWrapper>()({
	useMiddlewares: ["onlyBots"],
	useContexts: ["lru"] as const,
	fn: async (req, res, ctx) => {
		const request = req as WrapperRequest<WebWrapper>
		const postId = String(req.params.post_id ?? "")

		if (!postId) {
			return res.status(400).json({ error: "Missing post id" })
		}

		try {
			const cacheKey = `og-post-${postId}`

			let post = ctx.lru.get(cacheKey) as ComtyPost | undefined

			if (!post) {
				post = await fetchPostData(postId)
				ctx.lru.set(cacheKey, post)
			}

			if (!post.user?.username || !request.indexHtml) {
				return res.send(request.indexHtml ?? "")
			}

			const page = cheerio.load(request.indexHtml)
			const description = truncateDescription(post.message ?? "")

			page('meta[property="og:title"]').attr(
				"content",
				`@${post.user.username} post on Comty™`,
			)
			page('meta[property="og:description"]').attr("content", description)
			page('meta[property="og:image"]').attr(
				"content",
				`${getRequestOrigin(req)}/account/${encodeURIComponent(post.user.username)}/og-img.png`,
			)
			page('meta[property="og:url"]').attr(
				"content",
				`https://comty.app/post/${encodeURIComponent(postId)}`,
			)

			page('meta[property="og:site_name"]').attr("content", "Comty™")
			page('meta[property="og:type"]').attr("content", "website")
			page("meta[name='twitter:card']").attr("content", "summary_large_image")

			return res.send(page.html())
		} catch (error) {
			console.error(error)

			return res.send(request.indexHtml ?? "")
		}
	},
})
