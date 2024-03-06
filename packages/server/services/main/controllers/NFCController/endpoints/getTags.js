import { NFCTag } from "@db_models"

export default {
    method: "GET",
    route: "/tags",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let tags = await NFCTag.find({
            user_id: req.user.id
        })

        return res.json(tags)
    }
}