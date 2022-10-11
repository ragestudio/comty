import { Post } from "../../../models"
import getPostData from "./getPostData"

export default async (payload) => {
    const { user_id, message, additions, type, data } = payload

    const post = new Post({
        user_id: typeof user_id === "object" ? user_id.toString() : user_id,
        message: String(message).toString(),
        additions: additions ?? [],
        created_at: new Date().toISOString(),
        type: type,
        data: data,
    })

    await post.save()

    const resultPost = await getPostData({ post_id: post._id.toString() })

    global.wsInterface.io.emit(`post.new`, resultPost)
    global.wsInterface.io.emit(`post.new.${post.user_id}`, resultPost)

    return post
}