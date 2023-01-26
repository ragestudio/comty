export default {
    method: "GET",
    route: "/:user_id/data",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let user = await User.findOne(req.params.user_id)

        if (!user) {
            return res.status(404).json({ error: "User not exists" })
        }

        return res.json(user)
    }
}