import { Track } from "@db_models"

export default async (track_id, { limit = 50, offset = 0 } = {}) => {
    if (!track_id) {
        throw new OperationError(400, "Missing track_id")
    }

    const isMultiple = track_id.includes(",")

    if (isMultiple) {
        const track_ids = track_id.split(",")

        const tracks = await Track.find({ _id: { $in: track_ids } })
            .limit(limit)
            .skip(offset)

        return {
            total_count: await Track.countDocuments({ _id: { $in: track_ids } }),
            list: tracks.map(track => track.toObject()),
        }
    }

    const track = await Track.findById(track_id).catch(() => null)

    if (!track) {
        throw new OperationError(404, "Track not found")
    }

    return track
}