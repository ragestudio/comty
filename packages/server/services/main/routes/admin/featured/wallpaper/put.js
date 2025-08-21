import { FeaturedWallpaper } from "@db_models"
import momentTimezone from "moment-timezone"

export default {
	useMiddlewares: ["withAuthentication", "onlyAdmin"],
	fn: async (req, res) => {
		const data = req.body.wallpaper

		if (!data) {
			return res.status(400).json({
				error: "Invalid data",
			})
		}

		// try to find if data._id exists, else create a new one
		let wallpaper = null

		if (data._id) {
			wallpaper = await FeaturedWallpaper.findOne({
				_id: data._id,
			})
		} else {
			wallpaper = new FeaturedWallpaper()
		}

		const current_timezone = momentTimezone.tz.guess()

		wallpaper.active = data.active ?? wallpaper.active ?? true
		wallpaper.date =
			data.date ??
			momentTimezone.tz(Date.now(), current_timezone).format()
		wallpaper.url = data.url ?? wallpaper.url
		wallpaper.author = data.author ?? wallpaper.author

		await wallpaper.save()

		return res.json(wallpaper)
	},
}
