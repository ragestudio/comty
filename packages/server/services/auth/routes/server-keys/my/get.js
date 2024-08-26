import { ServerKeys } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const user_id = req.auth.session.user_id

        return await ServerKeys.find({
            owner_user_id: user_id
        })
    }
}