import { TrackOverride } from "@db_models"

export default async (req) => {
    const { track_id } = req.params
    const { service } = req.query

    const trackOverride = await TrackOverride.findOne({
        track_id: track_id,
        service: service,
    })

    if (!trackOverride) {
        throw new OperationError(404, "Track override not found")
    }

    return trackOverride.override
}