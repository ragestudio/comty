import AuthToken from "@shared-classes/AuthToken"
import { User } from "@shared-classes/DbModels"
import requiredFields from "@shared-utils/requiredFields"
import bcrypt from "bcrypt"

export default async (req, res) => {
    requiredFields(["username", "password"], req.body)

    const { username, password } = req.body

    let isEmail = username.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

    let query = isEmail ? { email: username } : { username: username }

    const user = await User.findOne(query).select("+password")

    if (!user) {
        throw new OperationError(401, "User not found")
    }

    if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({
            message: "Invalid credentials",
        })
    }

    const token = await AuthToken.createAuth({
        username: user.username,
        user_id: user._id.toString(),
        ip_address: req.headers["x-forwarded-for"]?.split(",")[0] ?? req.socket?.remoteAddress ?? req.ip,
        client: req.headers["user-agent"],
        //signLocation: global.signLocation,
    })

    return { token: token }
}