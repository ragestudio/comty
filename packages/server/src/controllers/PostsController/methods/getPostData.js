import { Post, User } from "../../../models"

export default async (payload) => {
    let {
        post_id,
    } = payload

    if (!post_id) {
        throw new Error("post_id not provided")
    }

    let post = await Post.findById(post_id).catch(() => false)

    if (!post) {
        throw new Error("Post not found")
    }

    let user = await User.findById(post.user_id).catch(() => false)

    if (!user) {
        user = {
            username: "Deleted user",
        }
    }

    return {
        ...post.toObject(),
        user,
    }
}