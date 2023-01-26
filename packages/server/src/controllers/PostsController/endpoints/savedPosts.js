import { Schematized } from "@lib"
import { GetPostData } from "../methods"

export default {
    method: "GET",
    route: "/saved",
    middlewares: ["withAuthentication"],
    fn: Schematized({
        select: ["user_id"]
    }, async (req, res) => {
        let posts = await GetPostData({
            limit: req.query?.limit,
            skip: req.query?.trim,
            for_user_id: req.user?._id.toString(),
            savedOnly: true,
        })

        return res.json(posts)
    })
}