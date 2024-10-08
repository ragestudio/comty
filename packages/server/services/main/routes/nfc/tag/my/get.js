import { NFCTag } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let tags = await NFCTag.find({
            user_id: req.auth.session.user_id
        })

        return tags
    }
}