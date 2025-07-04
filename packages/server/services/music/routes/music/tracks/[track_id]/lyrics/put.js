import { TrackLyric, Track } from "@db_models"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const { track_id } = req.params
		const { video_source, lrc, video_starts_at } = req.body

		// check if track exists
		let track = await Track.findById(track_id).catch(() => null)

		if (!track) {
			throw new OperationError(404, "Track not found")
		}

		if (track.publisher.user_id !== req.auth.session.user_id) {
			throw new OperationError(403, "Unauthorized")
		}

		// check if trackLyric exists
		let trackLyric = await TrackLyric.findOne({
			track_id: track_id,
		})

		// if trackLyric exists, update it, else create it
		if (!trackLyric) {
			trackLyric = new TrackLyric({
				track_id: track_id,
				video_source: video_source,
				video_starts_at: video_starts_at,
				lrc: lrc,
			})

			await trackLyric.save()
		} else {
			const update = Object()

			if (typeof video_source !== "undefined") {
				update.video_source = video_source
			}

			if (typeof lrc !== "undefined") {
				update.lrc = lrc
			}

			if (typeof video_starts_at !== "undefined") {
				update.video_starts_at = video_starts_at
			}

			trackLyric = await TrackLyric.findOneAndUpdate(
				{
					track_id: track_id,
				},
				update,
			)
		}

		return trackLyric
	},
}
