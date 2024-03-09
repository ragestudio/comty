import Users from "@classes/users"

export default {
    middlewares: ["withOptionalAuthentication"],
    fn: async (req) => {
        const { user_id } = req.params

        return await Users.data({
            user_id: user_id,
            from_user_id: req.auth?.session.user_id,
        })
    }
}