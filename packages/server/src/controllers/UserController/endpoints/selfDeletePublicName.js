import UpdateUserData from "../methods/updateUserData"

export default {
    method: "DELETE",
    route: "/self/public_name",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user_id = req.user._id.toString()

        UpdateUserData.update({
            user_id: user_id,
            update: {
                fullName: undefined
            }
        })
            .then((user) => {
                return res.json({
                    ...user
                })
            })
            .catch((err) => {
                return res.json(500).json({
                    error: err.message
                })
            })
    },
}