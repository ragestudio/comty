import Posts from "@classes/posts"

export default {
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        const payload = {
            limit: req.query?.limit,
            skip: req.query?.skip,
        }

        if (req.auth) {
            payload.user_id = req.auth.session.user_id
        }

        const result = await Posts.feed(payload)

        return result
    }
}