import { Badge } from "@models"

export default {
    method: "DELETE",
    route: "/badge/:badge_id",
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: async (req, res) => {
        const badge = await Badge.findById(req.params.badge_id).catch((err) => {
            res.status(500).json({ error: err })
            return false
        })

        if (!badge) {
            return res.status(404).json({ error: "No badge founded" })
        }

        badge.remove()

        return res.json(badge)
    }
}