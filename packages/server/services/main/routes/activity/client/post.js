import { RecentActivity } from "@db_models"

const IdToTypes = {
	"player.play": "track_played",
}

const MAX_RECENT_ACTIVITIES = 10

export default {
	middlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const user_id = req.auth.session.user_id
		let { id, payload } = req.body

		if (!id) {
			throw new OperationError(400, "Event id is required")
		}

		if (!payload) {
			throw new OperationError(400, "Event payload is required")
		}

		id = id.toLowerCase()

		if (!IdToTypes[id]) {
			throw new OperationError(400, `Event id ${id} is not supported`)
		}

		const type = IdToTypes[id]

		// Get the current latest activities
		let latestActivities = await RecentActivity.find({
			user_id: user_id,
			type: type,
		})
			.limit(MAX_RECENT_ACTIVITIES)
			.sort({ created_at: -1 }) // Newest first

		const sameActivity = await RecentActivity.findOne({
			user_id: user_id,
			type: type,
			payload: payload,
		})

		if (sameActivity) {
			// This event's payload/type is already in the recent activities.
			// The old instance should be removed to make way for the new one.
			await RecentActivity.findByIdAndDelete(sameActivity._id.toString())
		} else {
			// This event's payload/type is not in the recent activities.
			// The oldest activity should be removed to make way for the new one.
			if (latestActivities.length >= MAX_RECENT_ACTIVITIES) {
				await RecentActivity.findByIdAndDelete(
					latestActivities[MAX_RECENT_ACTIVITIES - 1]._id.toString(),
				)
			}
		}

		// Create the new activity
		const newActivity = await RecentActivity.create({
			user_id: user_id,
			type: type,
			payload: payload,
			created_at: new Date(),
		})

		return newActivity
	},
}
