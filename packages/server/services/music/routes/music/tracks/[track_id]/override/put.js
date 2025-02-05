import { TrackOverride } from "@db_models"

export default {
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: async (req) => {
        const { track_id } = req.params
        const { service, override } = req.body

        let trackOverride = await TrackOverride.findOne({
            track_id: track_id,
            service: service,
        }).catch(() => null)

        if (!trackOverride) {
            trackOverride = new TrackOverride({
                track_id: track_id,
                service: service,
                override: override,
            })

            await trackOverride.save()
        } else {
            trackOverride = await TrackOverride.findOneAndUpdate(
                {
                    track_id: track_id,
                    service: service,
                },
                {
                    override: override,
                },
            )
        }

        return trackOverride.override
    }
}