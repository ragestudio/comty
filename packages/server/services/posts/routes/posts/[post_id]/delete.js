import PostClass from "@classes/posts"
import { Post } from "@db_models"
export default {
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        // check if post is owned or if is admin
        const post = await Post.findById(req.params.post_id).catch(() => {
            return false
        })

        if (!post) {
            throw new OperationError(404, "Post not found")
        }

        const user = await req.auth.user()

        if (post.user_id.toString() !== user._id.toString()) {
            if (!user.roles.includes("admin")) {
                throw new OperationError(403, "You cannot delete this post")
            }
        }

        return await PostClass.delete({
            post_id: req.params.post_id
        })
    }
}