import { Controller } from "linebridge/dist/server"
import { Badge, User } from "../../models"
import { Schematized } from "../../lib"

export default class BadgesController extends Controller {
    static refName = "BadgesController"

    get = {
        "/badges": Schematized({
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
        }),
    }

    post = {
        "/badge": {
            middlewares: ["withAuthentication"],
            fn: Schematized({
                required: ["name"],
                select: ["name", "label", "description", "icon", "color"],
            }, async (req, res) => {
                await Badge.findOne(req.selection).then((data) => {
                    if (data) {
                        return res.status(409).json({
                            error: "This badge is already created",
                        })
                    }

                    let badge = new Badge({
                        name: req.selection.name,
                        label: req.selection.label,
                        description: req.selection.description,
                        icon: req.selection.icon,
                        color: req.selection.color,
                    })

                    badge.save()

                    return res.json(badge)
                })
            })
        },
        "/badge/:badge_id/giveToUser": {
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
    }

    put = {
        "/badge/:badge_id": {
            middlewares: ["withAuthentication", "onlyAdmin"],
            fn: Schematized({
                select: ["name", "label", "description", "icon", "color"],
            }, async (req, res) => {
                const badge = await Badge.findById(req.params.badge_id).catch((err) => {
                    res.status(500).json({ error: err })
                    return false
                })

                if (!badge) {
                    return res.status(404).json({ error: "No badge founded" })
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
    }

    delete = {
        "/badge/:badge_id": {
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
        },
        "/badge/:badge_id/removeFromUser": {
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
                if (!user.badges.includes(badge._id)) {
                    return res.status(409).json({ error: "User don't have this badge" })
                }

                user.badges = user.badges.filter(b => b !== badge._id.toString())

                user.save()

                return res.json(user)
            })
        }
    }
}