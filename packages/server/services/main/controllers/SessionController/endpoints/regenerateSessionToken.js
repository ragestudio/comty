import Token from "@lib/token"

export default {
    method: "POST",
    route: "/regenerate",
    fn: async (req, res) => {
        const { expiredToken, refreshToken } = req.body

        const token = await Token.regenerate(expiredToken, refreshToken).catch((error) => {
            res.status(400).json({ error: error.message })

            return null
        })

        if (!token) return

        return res.json({ token })
    },
}