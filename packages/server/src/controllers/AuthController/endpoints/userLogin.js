import passport from "passport"
import { Token } from "@lib"

export default {
    method: "POST",
    route: "/login",
    fn: async (req, res) => {
        passport.authenticate("local", { session: false }, async (error, user, options) => {
            if (error) {
                return res.status(500).json(`Error validating user > ${error.message}`)
            }

            if (!user) {
                return res.status(401).json("Invalid credentials")
            }

            const token = await Token.createNewAuthToken(user, options)

            return res.json({ token: token })
        })(req, res)
    }
}