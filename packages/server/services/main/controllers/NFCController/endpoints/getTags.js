import { NFCTag } from "@shared-classes/DbModels"

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