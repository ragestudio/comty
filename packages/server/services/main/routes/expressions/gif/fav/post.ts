import type API from "@services/main/main.service"
import ExpressionFavModel from "@db/expressions_favs"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res, ctx) => {
		// @ts-ignore
		const user_id = req.auth.session.user_id

		const { resource_url, metadata } = req.body

		let favFind = await ExpressionFavModel.find({
			user_id: user_id,
			type: "gif",
			resource_url: resource_url,
		})

		let fav = favFind[0]

		if (fav) {
			await ExpressionFavModel.delete({
				user_id: user_id,
				type: "gif",
				resource_url: resource_url,
				created_at: fav.created_at,
			})
		} else {
			fav = ExpressionFavModel.obj({
				user_id: user_id,
				type: "gif",
				resource_url: resource_url,
				metadata: metadata,
				created_at: new Date(),
			})

			await fav.save()
		}

		return fav
	},
})
