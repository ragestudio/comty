import User from "@classes/users"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        return await User.toggleFollow({
            user_id: req.params.user_id,
            from_user_id: req.auth.session.user_id,
            to: req.body.to,
        })
    }
}