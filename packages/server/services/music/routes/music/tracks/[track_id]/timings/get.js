import { TrackLyric } from "@db_models"

export default async (req) => {
	const { track_id } = req.params

	let result = await TrackLyric.findOne({
		track_id,
	}).lean()

	if (!result) {
		throw new OperationError(404, "Track lyric not found")
	}

	if (!result.timings) {
		throw new OperationError(404, "Timings not available for this track")
	}

	return result.timings
}
