import { Post } from "@shared-classes/DbModels"
import fullfillPostsData from "@utils/fullfillPostsData"

export default {
    method: "GET",
    route: "/post/:post_id/replies",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        const {
            limit = 50,
            offset = 0,
        } = req.query

        let replies = await Post.find({
            reply_to: req.params.post_id,
        })
            .skip(offset)
            .limit(limit)
            .sort({ created_at: -1 })

        replies = await fullfillPostsData({
            posts: replies,
            for_user_id: req.user?._id.toString(),
            skip: offset,
        })

        return res.json(replies)
    }
}