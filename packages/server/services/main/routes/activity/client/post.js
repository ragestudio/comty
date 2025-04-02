import { RecentActivity } from "@db_models"

const IdToTypes = {
    "player.play": "track_played"
}

export default {
    middlewares: [
        "withAuthentication",
    ],
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

        // get latest 20 activities
        let latestActivities = await RecentActivity.find({
            user_id: user_id,
            type: type,
        })
            .limit(20)
            .sort({ created_at: -1 })

        // check if the activity is already in some position and remove
        const sameLatestActivityIndex = latestActivities.findIndex((activity) => {
            return activity.payload === payload && activity.type === type
        })

        // if the activity is already in some position, remove it from that position
        if (sameLatestActivityIndex !== -1) {
            latestActivities.splice(sameLatestActivityIndex, 1)
        }

        // if the list is full, remove the oldest activity and add the new one
        if (latestActivities.length >= 20) {
            await RecentActivity.findByIdAndDelete(latestActivities[latestActivities.length - 1]._id)
        }

        const activity = await RecentActivity.create({
            user_id: user_id,
            type: type,
            payload: payload,
            created_at: new Date(),
        })

        return activity
    }
}