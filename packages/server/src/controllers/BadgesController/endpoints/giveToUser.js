import { Badge, User } from "@models"
import { Schematized } from "@lib"

export default {
    method: "POST",
    route: "/badge/:badge_id/giveToUser",
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: Schematized({
        required: ["user_id"],
        select: ["user_id"],
    }, async (req, res) => {
        const badge = await Badge.findById(req.params.badge_id).catch((err) => {
            res.status(500).json({ error: err })
            return false
        })

        if (!badge) {
            return res.status(404).json({ error: "No badge founded" })
        }

        const user = await User.findById(req.selection.user_id).catch((err) => {
            res.status(500).json({ error: err })
            return false
        })

        if (!user) {
            return res.status(404).json({ error: "No user founded" })
        }

        // check if user already have this badge
        if (user.badges.includes(badge._id)) {
            return res.status(409).json({ error: "User already have this badge" })
        }

        user.badges.push(badge._id.toString())

        user.save()

        return res.json(user)
    })
}