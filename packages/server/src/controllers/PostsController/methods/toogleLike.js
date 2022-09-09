import { Post, User } from "../../../models"
import modifyPostData from "./modifyPostData"

export default async (payload) => {
    let { post_id, user_id, to } = payload

    const post = await Post.findById(post_id).catch(() => false)
    const userData = await User.findById(user_id).catch(() => false)

    if (!post) {
        throw new Error("Post not found")
    }

    if (!userData) {
        throw new Error("User not found")
    }

    if (typeof to === "undefined") {
        to = !post.likes.includes(user_id)
    }

    if (to) {
        post.likes.push(user_id)
    } else {
        post.likes = post.likes.filter((id) => id !== user_id)
    }

    await modifyPostData(post, { likes: post.likes })

    global.wsInterface.io.emit(`post.${to ? "like" : "unlike"}`, {
        ...post.toObject(),
        user: userData.toObject(),
    })
    global.wsInterface.io.emit(`post.${to ? "like" : "unlike"}.${post.user_id}`, {
        ...post.toObject(),
        user: userData.toObject(),
    })
    global.wsInterface.io.emit(`post.${to ? "like" : "unlike"}.${post_id}`, post.toObject().likes)

    return post.toObject()
}