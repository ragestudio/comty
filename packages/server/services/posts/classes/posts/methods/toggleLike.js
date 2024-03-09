import { Post, PostLike } from "@db_models"

export default async (payload = {}) => {
    let { post_id, user_id, to } = payload

    if (!post_id || !user_id) {
        throw new OperationError(400, "Missing post_id or user_id")
    }

    // check if post exist
    let existPost = await Post.findOne({
        post_id,
    })

    if (!existPost) {
        throw new OperationError(404, "Post not found")
    }

    let likeObj = await PostLike.findOne({
        post_id,
        user_id,
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

    // global.engine.ws.io.of("/").emit(`post.${post_id}.likes.update`, {
    //     to,
    //     post_id,
    //     user_id,
    // })

    return {
        liked: to
    }
}