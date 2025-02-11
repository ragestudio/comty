import { MusicRelease, Track } from "@db_models"

export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		const { keywords, limit = 10, offset = 0 } = req.query

		const user_id = req.auth.session.user_id

		let searchQuery = {
			user_id,
		}

		if (keywords) {
			searchQuery = {
				...searchQuery,
				title: {
					$regex: keywords,
					$options: "i",
				},
			}
		}

		let releases = await MusicRelease.find(searchQuery)
			.sort({ created_at: -1 })
			.limit(limit)
			.skip(offset)

		if (req.query.resolveItemsData === "true") {
			releases = await Promise.all(
				playlists.map(async (playlist) => {
					playlist.items = await Track.find({
						_id: [...playlist.list],
					})

					return playlist
				}),
			)
		}

		return {
			total_length: await MusicRelease.countDocuments(searchQuery),
			items: releases,
		}
	},
}
