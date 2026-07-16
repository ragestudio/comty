import type API from "@services/music/music.service"

export default defineRoute<API>()({
	useContexts: ["redis"] as const,
	fn: async (req, res, ctx) => {
		const radioId = req.params.radio_id

		return await ctx.redis.client
			.hgetall(`radio-${radioId}`)
			.catch(() => null)
	},
})
