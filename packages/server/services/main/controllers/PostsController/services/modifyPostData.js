import { Post } from "@db_models"
import getPostData from "./getPostData"

export default async (post_id, modification) => {
    if (!post_id) {
        throw new Error("Cannot modify post data: post not found")
    }

    let post = await getPostData({ post_id: post_id })

    if (!post) {
        throw new Error("Cannot modify post data: post not found")
    }

    if (typeof modification === "object") {
        const result = await Post.findByIdAndUpdate(post_id, modification)

        await result.save()

        post = {
            ...post,
            ...result.toObject(),
            ...modification,
        }
    }

    global.engine.ws.io.of("/").emit(`post.dataUpdate`, post)
    global.engine.ws.io.of("/").emit(`post.dataUpdate.${post_id}`, post)

    return post
}