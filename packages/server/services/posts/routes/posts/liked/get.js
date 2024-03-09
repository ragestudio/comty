import Posts from "@classes/posts"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        return await Posts.getLiked({
            user_id: req.auth.session.user_id
        })
    }
}