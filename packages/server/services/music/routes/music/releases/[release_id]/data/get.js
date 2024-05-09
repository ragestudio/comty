import { MusicRelease, Track } from "@db_models"

export default async (req) => {
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
    const tracks = await Track.find({
        _id: { $in: release.list }
    })
        .limit(limit)
        .skip(offset)

    release.listLength = totalTracks
    release.list = tracks

    return release
}