import { Post } from "../../../models"

import modifyPostData from "./modifyPostData"

export default async (payload) => {
    let { post_id, user_id, to } = payload

    let post = await Post.findById(post_id).catch(() => false)

    if (!post) {
        throw new Error("Post not found")
    }

    if (typeof to === "undefined") {
        to = !post.likes.includes(user_id)
    }

    if (to) {
        post.likes.push(user_id)
    } else {
        post.likes = post.likes.filter((id) => id !== user_id)
    }

    post = await modifyPostData(post._id, { likes: post.likes })

    global.wsInterface.io.emit(`post.${to ? "like" : "unlike"}`, post)
    global.wsInterface.io.emit(`post.${to ? "like" : "unlike"}.${post.user_id}`, post)
    global.wsInterface.io.emit(`post.${to ? "like" : "unlike"}.${post_id}`, post)

    return post
}