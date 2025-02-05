import { Track, TrackLike } from "@db_models"

export default async (user_id, track_id, to) => {
    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    if (!track_id) {
        throw new OperationError(400, "Missing track_id")
    }

    const track = await Track.findById(track_id).catch(() => null)

    if (!track) {
        throw new OperationError(404, "Track not found")
    }

    let trackLike = await TrackLike.findOne({
        user_id: user_id,
        track_id: track_id,
    }).catch(() => null)

    return {
        liked: !!trackLike
    }
}