import { Schematized } from "@lib"
import { User } from "@models"

import updateUserPassword from "../services/updateUserPassword"
import bcrypt from "bcrypt"

export default {
    method: "POST",
    route: "/self/update_password",
    middlewares: ["withAuthentication"],
    fn: Schematized({
        required: ["currentPassword", "newPassword"],
        select: ["currentPassword", "newPassword",]
    }, async (req, res) => {
        const user = await User.findById(req.user._id).select("+password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const isPasswordValid = await bcrypt.compareSync(req.selection.currentPassword, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Current password dont match"
            })
        }

        const result = await updateUserPassword({
            user_id: req.user._id,
            password: req.selection.newPassword,
        }).catch((error) => {
            res.status(500).json({ message: error.message })
            return null
        })

        if (result) {
            return res.json(result)
        }
    })
}