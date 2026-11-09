import type WebWrapper from "@/main"
import fetchUserData from "@lib/fetchUserData"
import genUserCardImg from "@lib/genUserCardImg"
import type { WrapperRequest } from "@/types"

export default defineRoute<WebWrapper>()({
	useContexts: ["logoFile"] as const,
	fn: async (req, res, ctx) => {
		const request = req as WrapperRequest<WebWrapper>
		const username = String(req.params.username ?? "")

		if (!username) {
			return res.status(400).json({ error: "Missing username" })
		}

		try {
			const user = await fetchUserData(username)
			const image = await genUserCardImg(user, {
				logoFile: ctx.logoFile ?? undefined,
			})

			res.setHeader("Cache-Control", "public, max-age=86400")
			res.setHeader("Content-Type", "image/jpeg")

			return res.send(image)
		} catch (error) {
			console.error(error)

			return res.status(404).send(request.indexHtml ?? "")
		}
	},
})
