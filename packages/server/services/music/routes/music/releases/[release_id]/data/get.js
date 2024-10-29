import { MusicRelease, Track } from "@db_models"
import TrackClass from "@classes/track"

export default {
    middlewares: ["withOptionalAuthentication"],
    fn: async (req) => {
        const { release_id } = req.params
        const { limit = 50, offset = 0 } = req.query

        let release = await MusicRelease.findOne({
            _id: release_id
        })

        if (!release) {
            throw new OperationError(404, "Release not found")
        }

        release = release.toObject()

        const totalTracks = await Track.countDocuments({
            _id: release.list
        })

        const tracks = await TrackClass.get(release.list, {
            user_id: req.auth?.session?.user_id,
            onlyList: true
        })

        release.listLength = totalTracks
        release.list = tracks

        return release
    }
}