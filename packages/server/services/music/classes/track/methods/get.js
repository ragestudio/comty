import { Track, TrackLike } from "@db_models"

async function fullfillData(list, { user_id = null }) {
	if (!Array.isArray(list)) {
		list = [list]
	}

	const trackIds = list.map((track) => {
		return track._id
	})

	// if user_id is provided, fetch likes
	if (user_id) {
		const tracksLikes = await TrackLike.find({
			user_id: user_id,
			track_id: { $in: trackIds },
		})

		list = list.map(async (track) => {
			const trackLike = tracksLikes.find((trackLike) => {
				return trackLike.track_id.toString() === track._id.toString()
			})

			if (trackLike) {
				track.liked_at = trackLike.created_at
				track.liked = true
			}

			return track
		})

		list = await Promise.all(list)
	}

	// process some metadata
	list = list.map(async (track) => {
		if (track.metadata) {
			if (track.metadata.bitrate && track.metadata.bitrate > 9000) {
				track.metadata.lossless = true
			}
		}

		return track
	})

	list = await Promise.all(list)

	return list
}

export default async (track_id, { user_id = null, onlyList = false } = {}) => {
	if (!track_id) {
		throw new OperationError(400, "Missing track_id")
	}

	const isMultiple = Array.isArray(track_id) || track_id.includes(",")

	if (isMultiple) {
		const track_ids = Array.isArray(track_id)
			? track_id
			: track_id.split(",")

		let tracks = await Track.find({
			_id: { $in: track_ids },
		}).lean()

		tracks = await fullfillData(tracks, {
			user_id,
		})

		if (onlyList) {
			return tracks
		}

		return {
			total_count: await Track.countDocuments({
				_id: { $in: track_ids },
			}),
			list: tracks,
		}
	}

	let track = await Track.findOne({
		_id: track_id,
	}).lean()

	if (!track) {
		throw new OperationError(404, "Track not found")
	}

	track = await fullfillData(track, {
		user_id,
	})

	return track[0]
}
