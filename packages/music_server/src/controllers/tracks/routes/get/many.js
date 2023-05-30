import { Track } from "@models"

export default async (req, res) => {
    const { ids, limit = 20, offset = 0 } = req.query

    if (!ids) {
        return res.status(400).json({
            message: "IDs is required",
        })
    }

    let tracks = await Track.find({
        _id: [...ids],
        public: true,
    })
        .limit(limit)
        .skip(offset)
        .catch((err) => {
            return []
        })

    return res.json(tracks)
}