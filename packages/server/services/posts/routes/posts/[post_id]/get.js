import Posts from "@classes/posts"

export default {
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        const result =  await Posts.data({
            post_id: req.params.post_id,
            for_user_id: req.user?._id.toString(),
        })

        return result
    }
}