import { Post } from "@db_models"
import { DateTime } from "luxon"
import fullfill from "./fullfill"

export default async (post_id, update) => {
    let post = await Post.findById(post_id)

    if (!post) {
        throw new OperationError(404, "Post not found")
    }

    const updateKeys = Object.keys(update)

    updateKeys.forEach((key) => {
        post[key] = update[key]
    })

    post.updated_at = DateTime.local().toISO()

    await post.save()

    post = post.toObject()

    const result = await fullfill({
        posts: post,
    })

    global.websocket.io.of("/").emit(`post.update`, result[0])
    global.websocket.io.of("/").emit(`post.update.${post_id}`, result[0])

    return result[0]
}