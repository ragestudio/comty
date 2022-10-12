import { Post } from "../../../models"
import getPostData from "./getPostData"

export default async (payload) => {
    const { user_id, message, additions, type, data } = payload

    // set creation date (Must be in UTC)
    const created_at = new Date().toISOString()

    const post = new Post({
        user_id: typeof user_id === "object" ? user_id.toString() : user_id,
        message: String(message).toString(),
        additions: additions ?? [],
        created_at: created_at,
        type: type,
        data: data,
    })

    await post.save()

    const resultPost = await getPostData({ post_id: post._id.toString() })

    global.wsInterface.io.emit(`post.new`, resultPost)
    global.wsInterface.io.emit(`post.new.${post.user_id}`, resultPost)

    return post
}