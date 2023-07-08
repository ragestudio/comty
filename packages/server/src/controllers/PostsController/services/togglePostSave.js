import { SavedPost } from "../../../models"

export default async (payload) => {
    let { post_id, user_id } = payload

    if (!post_id || !user_id) {
        throw new Error("Missing post_id or user_id")
    }

    let post = await SavedPost.findOne({ post_id, user_id }).catch((err) => {
        return false
    })

    if (post) {
        await SavedPost.findByIdAndDelete(post._id).catch((err) => {
            throw new Error("Cannot delete saved post")
        })
    } else {
        post = new SavedPost({
            post_id,
            user_id,
        })

        await post.save().catch((err) => {
            throw new Error("Cannot save post")
        })
    }

    return post
}