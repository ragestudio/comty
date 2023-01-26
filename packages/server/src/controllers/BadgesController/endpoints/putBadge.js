import { Badge } from "@models"
import { Schematized } from "@lib"

export default {
    method: "PUT",
    route: "/",
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: Schematized({
        select: ["badge_id", "name", "label", "description", "icon", "color"],
    }, async (req, res) => {
        let badge = await Badge.findById(req.selection.badge_id).catch((err) => null)

        if (!badge) {
            badge = new Badge()
        }

        badge.name = req.selection.name || badge.name
        badge.label = req.selection.label || badge.label
        badge.description = req.selection.description || badge.description
        badge.icon = req.selection.icon || badge.icon
        badge.color = req.selection.color || badge.color

        badge.save()

        return res.json(badge)
    })
}