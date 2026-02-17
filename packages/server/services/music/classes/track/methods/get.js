import { Track, TrackLyric } from "@db_models"
import Library from "@classes/library"

// transform minutes:seconds.milliseconds to milliseconds
function timecodeToMs(time) {
	if (!time) {
		return 0
	}

	const [minutes, rest] = time.split(":")
	const [seconds, milliseconds] = rest.split(".")

	return (
		(parseInt(minutes, 10) * 60 + parseInt(seconds, 10)) * 1000 +
		parseInt(milliseconds, 10)
	)
}

function parseTimings(timings) {
	if (!Array.isArray(timings)) {
		return null
	}

	// first parse all start times
	timings = timings.map((timing) => {
		timing.start_ms = timecodeToMs(timing.start)

		return timing
	})

	// set the end time with the next start time
	timings = timings.map((timing, index) => {
		const next = timings[index + 1]

		if (next) {
			timing.end_ms = next.start_ms
		}

		return timing
	})

	return timings
}

async function fullfillData(list, { user_id = null }) {
	if (!Array.isArray(list)) {
		list = [list]
	}

	// fetch timings
	const lyrics = await TrackLyric.find({
		track_id: { $in: list.map((track) => track._id) },
	}).lean()

	for (const track of list) {
		const lyric = lyrics.find((lyric) => {
			return lyric.track_id.toString() === track._id.toString()
		})

		if (lyric) {
			if (lyric.timings) {
				track.timings = parseTimings(lyric.timings)
			}
		}
	}

	// if user_id is provided, fetch likes
	if (user_id) {
		const trackIds = list.map((track) => {
			return track._id
		})

		const tracksLikes = await Library.isFavorite(
			user_id,
			trackIds,
			"tracks",
		)

		list = list.map(async (track) => {
			const trackLike = tracksLikes.find((trackLike) => {
				return trackLike.item_id.toString() === track._id.toString()
			})

			if (trackLike) {
				track.liked_at = trackLike.created_at
				track.liked = trackLike.liked
			}

			return track
		})

		list = await Promise.all(list)
	} else {
		list = list.map((track) => {
			delete track.source
			delete track.publisher

			return track
		})
	}

	return list
}

export default async (track_id, { user_id = null, onlyList = false } = {}) => {
	if (!track_id) {
		throw new OperationError(400, "Missing track_id")
	}

	const isMultiple = Array.isArray(track_id) || track_id.includes(",")

	let totalItems = 1
	let data = null

	if (isMultiple) {
		const track_ids = Array.isArray(track_id)
			? track_id
			: track_id.split(",")

		data = await Track.find({
			_id: { $in: track_ids },
		}).lean()

		// order tracks by ids
		data = data.sort((a, b) => {
			return (
				track_ids.indexOf(a._id.toString()) -
				track_ids.indexOf(b._id.toString())
			)
		})

		totalItems = await Track.countDocuments({
			_id: { $in: track_ids },
		})
	} else {
		data = await Track.findOne({
			_id: track_id,
		}).lean()

		if (!data) {
			throw new OperationError(404, "Track not found")
		}
	}

	data = await fullfillData(data, {
		user_id,
	})

	if (isMultiple) {
		if (onlyList) {
			return data
		}

		return {
			total_count: totalItems,
			list: data,
		}
	}

	return data[0]
}
