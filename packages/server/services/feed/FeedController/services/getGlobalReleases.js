import { Release } from "@db_models"

export default async (payload) => {
    const {
        limit = 20,
        skip = 0,
    } = payload

    let releases = await Release.find({
        $or: [
            { public: true },
        ]
    })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)

    releases = Promise.all(releases.map(async (release) => {
        release = release.toObject()

        return release
    }))

    return releases
}