import { RecentActivity } from "@db_models"

import TrackClass from "@classes/track"

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const user_id = req.auth.session.user_id

		let activities = await RecentActivity.find({
			user_id: user_id,
			type: "track_played",
		})
			.limit(req.query.limit ?? 10)
			.sort({ created_at: -1 })

		// filter tracks has different service than comtymusic
		activities = activities.map((activity) => {
			if (
				activity.payload.service &&
				activity.payload.service !== "default"
			) {
				return null
			}

			return activity
		})

		// filter null & undefined tracks
		activities = activities.filter((activity) => {
			return activity
		})

		// filter undefined tracks_ids
		activities = activities.filter((activity) => {
			return activity.payload && activity.payload.track_id
		})

		// map track objects to track ids
		let tracks_ids = activities.map((activity) => {
			return activity.payload.track_id
		})

		let tracks = await TrackClass.get(tracks_ids, {
			user_id: user_id,
			onlyList: true,
		})

		// sort tracks by track_ids
		tracks = tracks.sort((a, b) => {
			const aIndex = tracks_ids.indexOf(a._id.toString())
			const bIndex = tracks_ids.indexOf(b._id.toString())

			return aIndex - bIndex
		})

		return tracks
	},
}
