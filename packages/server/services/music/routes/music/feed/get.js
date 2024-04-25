import { MusicRelease, Track } from "@db_models"

export default async (req) => {
    const { limit = 10, trim = 0 } = req.query

    let result = await MusicRelease.find({})
        .limit(limit)
        .skip(trim)

    return {
        items: result,
    }
}