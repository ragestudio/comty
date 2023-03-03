import { Schematized } from "@lib"
import { Badge } from "@models"

export default {
    method: "GET",
    route: "/",
    fn: Schematized({
        select: ["_id", "name", "label"],
    }, async (req, res) => {
        let badges = []

        if (req.selection._id) {
            badges = await Badge.find({
                _id: { $in: req.selection._id },
            })

            badges = badges.map(badge => badge.toObject())
        } else {
            badges = await Badge.find(req.selection).catch((err) => {
                res.status(500).json({ error: err })
                return false
            })
        }

        if (badges) {
            return res.json(badges)
        }
    })
}