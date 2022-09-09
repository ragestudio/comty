import { Post, User } from "../../../models"

export default async (payload) => {
    const { post_id, by_user_id } = payload

    if (!by_user_id) {
        throw new Error("by_user_id not provided")
    }

    const post = await Post.findById(post_id)

    if (!post) {
        throw new Error("Post not found")
    }

    const userData = await User.findById(by_user_id)

    if (!userData) {
        throw new Error("User not found")
    }

    const hasAdmin = userData.roles.includes("admin")

    // check if user is the owner of the post
    if (post.user_id !== by_user_id && !hasAdmin) {
        throw new Error("You are not allowed to delete this post")
    }

    await post.remove()
    global.wsInterface.io.emit(`post.delete`, post_id)

    return post.toObject()
}