import { Post, PostLike } from "@db_models"

export default async (payload = {}) => {
    let { post_id, user_id, to } = payload

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

    let likeObj = await PostLike.findOne({
        user_id,
        post_id,
    })

    if (typeof to === "undefined") {
        if (likeObj) {
            to = false
        } else {
            to = true
        }
    }

    if (to) {
        likeObj = new PostLike({
            post_id,
            user_id,
        })

        await likeObj.save()
    } else {
        await PostLike.findByIdAndDelete(likeObj._id)
    }

    const count = await PostLike.count({
        post_id,
    })

    const eventData = {
        to,
        post_id,
        user_id,
        count: count,
    }

    global.rtengine.io.of("/").emit(`post.${post_id}.likes.update`, eventData)
    global.rtengine.io.of("/").emit(`post.like.update`, eventData)

    return {
        liked: to,
        count: count
    }
}