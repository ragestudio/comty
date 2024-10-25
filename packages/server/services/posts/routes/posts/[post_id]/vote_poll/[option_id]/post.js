import Posts from "@classes/posts"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const result = await Posts.votePoll({
            user_id: req.auth.session.user_id,
            post_id: req.params.post_id,
            option_id: req.params.option_id,
        })

        return result
    }
}