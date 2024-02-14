import Token from "@lib/token"
import { User } from "@shared-classes/DbModels"
import bcrypt from "bcrypt"

export default {
    method: "POST",
    route: "/login",
    fn: async (req, res) => {
        const { username, password } = req.body

        let isEmail = username.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

        let query = isEmail ? { email: username } : { username: username }

        const user = await User.findOne(query).select("+password")

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials, user not found",
            })
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({
                message: "Invalid credentials",
            })
        }

        const token = await Token.createAuth({
            username: user.username,
            user_id: user._id.toString(),
            ip_address: req.headers["x-forwarded-for"]?.split(",")[0] ?? req.socket.remoteAddress,
            client: req.headers["user-agent"],
            signLocation: global.signLocation,
        })

        return res.json({ token: token })
    }
}