import { User } from "@models"

import bcrypt from "bcrypt"

export default {
    method: "POST",
    route: "/update_password/:user_id",
    middlewares: ["withAuthentication", "onlyAdmin"],
    fn: async (req, res) => {
        const { password } = req.body

        if (!password) {
            return res.status(400).json({ message: "Missing password" })
        }

        const { user_id } = req.params

        const user = await User.findById(user_id).select("+password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        // hash the password
        const hash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS ?? 3))

        user.password = hash

        await user.save()

        return res.status(200).json({
            status: "ok",
            message: "Password updated successfully",
        })
    }
}