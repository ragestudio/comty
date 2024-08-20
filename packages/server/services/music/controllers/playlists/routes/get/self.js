import { Playlist, Release, Track } from "@db_models"
import { AuthorizationError, NotFoundError } from "@shared-classes/Errors"

export default async (req, res) => {
	if (!req.session) {
		return new AuthorizationError(req, res)
	}

	const { keywords, limit = 10, offset = 0 } = req.query

	const user_id = req.session.user_id.toString()

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

	const playlistsCount = await Playlist.countDocuments(searchQuery)
	const releasesCount = await Release.countDocuments(searchQuery)

	let total_length = playlistsCount + releasesCount

	let playlists = await Playlist.find(searchQuery)
		.sort({ created_at: -1 })
		.limit(limit)
		.skip(offset)

	playlists = playlists.map((playlist) => {
		playlist = playlist.toObject()

		playlist.type = "playlist"

		return playlist
	})

	let releases = await Release.find(searchQuery)
		.sort({ created_at: -1 })
		.limit(limit)
		.skip(offset)

	let result = [...playlists, ...releases]

	if (req.query.resolveItemsData === "true") {
		result = await Promise.all(
			playlists.map(async playlist => {
				playlist.list = await Track.find({
					_id: [...playlist.list],
				})

				return playlist
			}),
		)
	}

	return res.json({
		total_length: total_length,
		items: result,
	})
}
