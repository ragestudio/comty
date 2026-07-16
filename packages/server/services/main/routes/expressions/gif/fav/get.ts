import API from "@services/main/main.service"
import ExpressionFavModel from "@db/expressions_favs"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res, ctx) => {
		// @ts-ignore
		const user_id = req.auth.session.user_id
		//const { limit = 30, page = 0 } = req.query

		const gifs = await ExpressionFavModel.find(
			{
				user_id: user_id,
				type: "gif",
			},
			// {
			// 	limit: parseInt(limit),
			// },
		)

		return gifs
	},
})
