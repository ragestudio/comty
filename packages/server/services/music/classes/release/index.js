import { MusicRelease, Track } from "@db_models"
import TrackClass from "../track"

const AllowedUpdateFields = [
	"title",
	"cover",
	"album",
	"artist",
	"type",
	"public",
	"items",
]

export default class Release {
	// TODO: implement pagination
	static async data(id, { user_id = null, limit = 10, offset = 0 } = {}) {
		let release = await MusicRelease.findOne({
			_id: id,
		})

		if (!release) {
			throw new OperationError(404, "Release not found")
		}

		release = release.toObject()

		const items = release.items ?? release.list

		const totalTracks = await Track.countDocuments({
			_id: items,
		})

		const tracks = await TrackClass.get(items, {
			user_id: user_id,
			onlyList: true,
		})

		release.items = tracks
		release.total_items = totalTracks
		release.total_duration = tracks.reduce((acc, track) => {
			if (track.metadata?.duration) {
				return acc + parseFloat(track.metadata.duration)
			}

			return acc
		}, 0)

		return release
	}

	static async create(payload) {
		if (!payload.title) {
			throw new OperationError(400, "Release title is required")
		}

		if (!payload.items) {
			throw new OperationError(400, "Release items is required")
		}

		// ensure list is an array of strings with tracks ids only
		payload.items = payload.items.map((item) => {
			return item._id ?? item
		})

		const release = new MusicRelease({
			user_id: payload.user_id,
			created_at: Date.now(),
			title: payload.title,
			cover: payload.cover,
			explicit: payload.explicit,
			type: payload.type,
			items: payload.items,
			public: payload.public,
		})

		await release.save()

		return release
	}

	static async update(id, payload) {
		let release = await MusicRelease.findById(id).catch((err) => {
			return false
		})

		if (!release) {
			throw new OperationError(404, "Release not found")
		}

		if (release.user_id !== payload.user_id) {
			throw new PermissionError(
				403,
				"You dont have permission to edit this release",
			)
		}

		for (const field of AllowedUpdateFields) {
			if (typeof payload[field] !== "undefined") {
				release[field] = payload[field]
			}
		}

		// ensure list is an array of strings with tracks ids only
		release.items = release.items.map((item) => {
			return item._id ?? item
		})

		await MusicRelease.findByIdAndUpdate(id, release)

		return release
	}

	static async delete(id, payload = {}) {
		let release = await MusicRelease.findById(id).catch((err) => {
			return false
		})

		if (!release) {
			throw new OperationError(404, "Release not found")
		}

		// check permission
		if (release.user_id !== payload.user_id) {
			throw new PermissionError(
				403,
				"You dont have permission to edit this release",
			)
		}

		const items = release.items ?? release.list

		const items_ids = items.map((item) => item._id ?? item)

		// delete all releated tracks
		await Track.deleteMany({
			_id: { $in: items_ids },
		})

		// delete release
		await MusicRelease.deleteOne({
			_id: id,
		})

		return release
	}

	static async fullfillItemData(release) {
		return release
	}
}
