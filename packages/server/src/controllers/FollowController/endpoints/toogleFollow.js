import { Schematized } from "@lib"
import { User, UserFollow } from "@models"

import followUser from "../services/followUser"
import unfollowUser from "../services/unfollowUser"

export default {
    method: "POST",
    route: "/user/toogle",
    middlewares: ["withAuthentication"],
    fn: Schematized({
        select: ["user_id", "username"],
    }, async (req, res) => {
        const selfUserId = req.user._id.toString()
        let targetUserId = null
        let result = null

        if (typeof req.selection.user_id === "undefined" && typeof req.selection.username === "undefined") {
            return res.status(400).json({ message: "No user_id or username provided" })
        }

        if (typeof req.selection.user_id !== "undefined") {
            targetUserId = req.selection.user_id
        } else {
            const user = await User.findOne({ username: req.selection.username })

            if (!user) {
                return res.status(404).json({ message: "User not found" })
            }

            targetUserId = user._id.toString()
        }

        // check if already following
        const isFollowed = await UserFollow.findOne({
            user_id: selfUserId,
            to: targetUserId,
        })

        // if already following, delete
        if (isFollowed) {
            result = await unfollowUser({
                user_id: selfUserId,
                to: targetUserId,
            }).catch((error) => {
                return res.status(500).json({ message: error.message })
            })
        } else {
            result = await followUser({
                user_id: selfUserId,
                to: targetUserId,
            }).catch((error) => {
                return res.status(500).json({ message: error.message })
            })
        }

        return res.json(result)
    })
}