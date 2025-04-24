import { Track, TrackLike } from "@db_models"

export default async (user_id, track_id, to) => {
	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	if (!track_id) {
		throw new OperationError(400, "Missing track_id")
	}

	const track = await Track.findById(track_id)

	if (!track) {
		throw new OperationError(404, "Track not found")
	}

	let trackLike = await TrackLike.findOne({
		user_id: user_id,
		track_id: track_id,
	}).catch(() => null)

	if (typeof to === "undefined") {
		to = !!!trackLike
	}

	if (to) {
		if (!trackLike) {
			trackLike = new TrackLike({
				user_id: user_id,
				track_id: track_id,
				created_at: Date.now(),
			})

			await trackLike.save()
		}
	} else {
		if (trackLike) {
			await TrackLike.deleteOne({
				user_id: user_id,
				track_id: track_id,
			})

			trackLike = null
		}
	}

	if (global.websockets) {
		const targetSocket =
			await global.websockets.find.clientsByUserId(user_id)

		if (targetSocket) {
			await targetSocket.emit("music:track:toggle:like", {
				track_id: track_id,
				action: trackLike ? "liked" : "unliked",
			})
		}
	}

	return {
		liked: trackLike ? true : false,
		track_like_id: trackLike ? trackLike._id : null,
		track_id: track._id.toString(),
	}
}
