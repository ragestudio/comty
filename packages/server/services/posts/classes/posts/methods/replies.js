import { Post } from "@db_models"
import fullfillPostsData from "./fullfill"

export default async (payload = {}) => {
    const {
        post_id,
        for_user_id,
        trim = 0,
        limit = 50,
    } = payload

    if (!post_id) {
        throw new OperationError(400, "Post ID is required")
    }

    let posts = await Post.find({
        reply_to: post_id,
    })
        .limit(limit)
        .skip(trim)
        .sort({ created_at: -1 })

    posts = await fullfillPostsData({
        posts,
        for_user_id,
    })

    return posts
}