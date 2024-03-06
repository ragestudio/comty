import { Release, Track } from "@db_models"
import { AuthorizationError, NotFoundError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const { keywords, limit = 10, offset = 0 } = req.query

    const user_id = req.session.user_id.toString()

    let searchQuery = {
        user_id,
    }

    if (keywords) {
        searchQuery = {
            ...searchQuery,
            title: {
                $regex: keywords,
                $options: "i",
            },
        }
    }

    const total_length = await Release.count(searchQuery)

    let releases = await Release.find(searchQuery)
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(offset)

    if (!releases) {
        return new NotFoundError("Releases not found")
    }

    if (req.query.resolveItemsData === "true") {
        releases = await Promise.all(
            releases.map(async (release) => {
                release.list = await Track.find({
                    _id: [...release.list],
                })

                return release
            }),
        )
    }

    return res.json({
        total_length: total_length,
        items: releases,
    })
}
