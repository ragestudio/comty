import AccountClass from "@classes/account"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        return await AccountClass.deleteSession({
            user_id: req.auth.session.user_id,
            token: req.auth.token,
        })
    }
}