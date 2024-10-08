import Posts from "@classes/posts"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        return await Posts.getLiked({
            trim: req.query.trim,
            limit: req.query.limit,
            user_id: req.auth.session.user_id
        })
    }
}