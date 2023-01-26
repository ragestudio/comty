import { GetPostData } from "../methods"

export default {
    method: "GET",
    route: "/user/:user_id",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        let posts = await GetPostData({
            limit: req.query?.limit,
            skip: req.query?.trim,
            for_user_id: req.user?._id.toString(),
            from_user_id: req.params.user_id,
        })

        return res.json(posts)
    }
}