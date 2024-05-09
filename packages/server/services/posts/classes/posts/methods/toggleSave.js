import { Post, PostSave } from "@db_models"

export default async (payload = {}) => {
    let { post_id, user_id } = payload

    if (!post_id || !user_id) {
        throw new OperationError(400, "Missing post_id or user_id")
    }

    // check if post exist
    let existPost = await Post.findOne({
        _id: post_id,
    })

    if (!existPost) {
        throw new OperationError(404, "Post not found")
    }

    let post = await PostSave.findOne({ post_id, user_id })

    if (post) {
        await PostSave.findByIdAndDelete(post._id).catch((err) => {
            throw new OperationError(500, `An error has occurred: ${err.message}`)
        })

        post = null
    } else {
        post = new PostSave({
            post_id,
            user_id,
        })

        await post.save().catch((err) => {
            throw new OperationError(500, `An error has occurred: ${err.message}`)
        })
    }

    return {
        saved: !!post,
    }
}