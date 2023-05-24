import getMutuals from "@services/getMutuals"

export default {
    method: "GET",
    route: "/quick",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let mutuals = await getMutuals({
            from_user_id: req.user._id.toString(),
        }).catch((error) => {
            console.error(error)

            return []
        })

        return res.json({
            friends: mutuals,
        })
    }
}