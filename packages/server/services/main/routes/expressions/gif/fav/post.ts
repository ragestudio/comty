import type API from "@services/main/main.service"
import ExpressionFavModel from "@db/expressions_favs"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res, ctx) => {
		const user_id = req.auth.session.user_id

		const { _id, resource_url, metadata } = req.body

		let fav = null

		if (typeof _id === "string") {
			fav = await ExpressionFavModel.findOne({
				user_id: user_id,
				type: "gif",
				_id: Number(_id),
			})
		}

		if (fav) {
			await fav.delete()
		} else {
			fav = ExpressionFavModel.obj({
				_id: new Date().getTime(),
				type: "gif",
				user_id: user_id,
				resource_url: resource_url,
				metadata: metadata,
			})

			await fav.save()
		}

		return fav.toRaw()
	},
})
