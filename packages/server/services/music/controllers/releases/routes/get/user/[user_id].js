import { Release } from "@db_models"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const { user_id } = req.params
    const { keywords, limit = 10, offset = 0 } = req.query

    const total_length = await Release.countDocuments({
        user_id,
    })

    let releases = await Release.find({
        user_id,
        public: true,
    })
        .limit(limit)
        .skip(offset)
        .sort({ created_at: -1 })

    return res.json({
        total_length,
        items: releases
    })
}