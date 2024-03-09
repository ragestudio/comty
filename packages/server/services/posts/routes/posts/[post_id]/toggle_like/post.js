import Posts from "@classes/posts"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        const result = await Posts.toggleLike({
            post_id: req.params.post_id,
            user_id: req.auth.session.user_id
        })

        return result
    }
}