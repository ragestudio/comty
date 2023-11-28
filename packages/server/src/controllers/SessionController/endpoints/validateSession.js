import Token from "@lib/token"

export default {
    method: "POST",
    route: "/validate",
    fn: async (req, res) => {
        const token = req.body.token

        const result = await Token.validate(token)

        return res.json(result)
    },
}