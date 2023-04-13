import passport from "passport"
import { Token } from "@lib"

export default {
    method: "POST",
    route: "/login",
    fn: async (req, res) => {
        passport.authenticate("local", { session: false }, async (error, user, options) => {
            if (error) {
                return res.status(500).json({
                    message: `Error validating user > ${error.message}`,
                })
            }

            if (!user) {
                return res.status(401).json({
                    message: "Invalid credentials",
                })
            }

            const token = await Token.createNewAuthToken({
                username: user.username,
                user_id: user._id.toString(),
                ip_address: req.headers["x-forwarded-for"]?.split(",")[0] ?? req.socket.remoteAddress,
                client: req.headers["user-agent"],
                signLocation: global.signLocation,
            }, options)

            return res.json({ token: token })
        })(req, res)
    }
}