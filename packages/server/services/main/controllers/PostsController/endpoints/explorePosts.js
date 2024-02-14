import { Schematized } from "@lib"
import { GetPostData } from "../services"

export default {
    method: "GET",
    route: "/explore",
    middlewares: ["withOptionalAuthentication"],
    fn: Schematized({
        select: ["user_id"]
    }, async (req, res) => {
        let posts = await GetPostData({
            limit: req.query?.limit,
            skip: req.query?.trim,
            from_user_id: req.query?.user_id,
            for_user_id: req.user?._id.toString(),
        })

        return res.json(posts)
    })
}