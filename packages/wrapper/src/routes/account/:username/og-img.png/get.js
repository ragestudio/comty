import genUserCardImg from "@lib/genUserCardImg"
import fetchUserData from "@lib/fetchUserData"

export default {
	useContexts: ["logoFile"],
	fn: async (req, res, ctx) => {
		try {
			const { username } = req.params
			const user = await fetchUserData(username)

			if (!user) {
				throw new Error(`Post not found`)
			}

			const imgBuff = await genUserCardImg(username, {
				logoFile: ctx.logoFile,
			})

			res.set("Cache-Control", "public, max-age=86400")
			res.setHeader("Content-Type", "image/png")
			res.send(imgBuff)
		} catch (error) {
			console.error(error)
			res.send(req.indexHtml)
		}
	},
}
