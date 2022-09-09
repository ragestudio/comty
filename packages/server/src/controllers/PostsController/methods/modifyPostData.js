import { Post } from "../../../models"
import lodash from "lodash"

export default async (post, modification) => {
    if (typeof post === "string") {
        post = await Post.findById(post).catch(() => false)
    }

    if (!post) {
        throw new Error("Cannot modify post data: post not found")
    }

    if (typeof modification === "object") {
        post = lodash.merge(post, modification)
    }

    await post.save()

    global.wsInterface.io.emit(`post.dataUpdate`, post.toObject())
    global.wsInterface.io.emit(`post.dataUpdate.${post._id}`, post.toObject())

    return post
}