import * as cheerio from "cheerio"

import type WebWrapper from "@/main"
import fetchUserData from "@lib/fetchUserData"
import getRequestOrigin from "@lib/getRequestOrigin"
import type { ComtyUser, WrapperRequest } from "@/types"

export default defineRoute<WebWrapper>()({
	useMiddlewares: ["onlyBots"],
	useContexts: ["lru"] as const,
	fn: async (req, res, ctx) => {
		const request = req as WrapperRequest<WebWrapper>
		const username = String(req.params.username ?? "")

		if (!username) {
			return res.status(400).json({ error: "Missing username" })
		}

		try {
			const cacheKey = `og-user-${username}`

			let user = ctx.lru.get(cacheKey) as ComtyUser | undefined

			if (!user) {
				user = await fetchUserData(username)
				ctx.lru.set(cacheKey, user)
			}

			if (!request.indexHtml) {
				return res.status(503).json({ error: "App dist is not available" })
			}

			const page = cheerio.load(request.indexHtml)

			page('meta[property="og:title"]').attr(
				"content",
				`@${user.username} on Comty™`,
			)
			page('meta[property="og:description"]').attr(
				"content",
				user.description ?? "",
			)
			page('meta[property="og:image"]').attr(
				"content",
				`${getRequestOrigin(req)}${request.path}/og-img.png`,
			)
			page('meta[property="og:url"]').attr(
				"content",
				`https://comty.app/account/${encodeURIComponent(username)}`,
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
