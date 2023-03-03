import { Token } from "@lib"

export default {
    method: "POST",
    route: "/regenerate",
    middlewares: ["useJwtStrategy"],
    fn: async (req, res) => {
        const { expiredToken, refreshToken } = req.body

        const token = await Token.regenerateSession(expiredToken, refreshToken).catch((error) => {
            res.status(400).json({ error: error.message })

            return null
        })

        if (!token) return

        return res.json({ token })
    },
}