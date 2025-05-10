import { Track } from "@db_models"

const allowedFields = ["title", "artist", "album", "cover", "public"]

export default async (track_id, payload) => {
	if (!track_id) {
		throw new OperationError(400, "Missing track_id")
	}

	const track = await Track.findById(track_id)

	if (!track) {
		throw new OperationError(404, "Track not found")
	}

	if (track.publisher.user_id !== payload.user_id) {
		throw new PermissionError(
			403,
			"You dont have permission to edit this track",
		)
	}

	for (const field of allowedFields) {
		if (payload[field] !== undefined) {
			track[field] = payload[field]
		}
	}

	track.modified_at = Date.now()

	return await track.save()
}
