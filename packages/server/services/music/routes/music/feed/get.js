import { MusicRelease, Track } from "@db_models"

export default async (req) => {
    const { limit = 10, trim = 0, order = "desc" } = req.query

    const searchQuery = {}

    const total_length = await MusicRelease.countDocuments(searchQuery)

    let result = await MusicRelease.find(searchQuery)
        .limit(limit)
        .skip(trim)
        .sort({ created_at: order === "desc" ? -1 : 1 })

    return {
        total_length: total_length,
        has_more: total_length > trim + result.length,
        items: result,
    }
}