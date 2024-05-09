import { MusicRelease, Track } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const { release_id } = req.params

        let release = await MusicRelease.findOne({
            _id: release_id
        })

        if (!release) {
            throw new OperationError(404, "Release not found")
        }

        if (release.user_id !== req.auth.session.user_id) {
            throw new OperationError(403, "Unauthorized")
        }

        await MusicRelease.deleteOne({
            _id: release_id
        })

        return release
    }
}