import { Post, PostSave } from "@db_models"

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

    let saveObj = await PostSave.findOne({ post_id, user_id })

    if (typeof to === "undefined") {
        if (saveObj) {
            to = false
        } else {
            to = true
        }
    }

    if (to) {
        saveObj = new PostSave({
            post_id,
            user_id,
        })

        await saveObj.save()
    } else {
        await PostSave.findByIdAndDelete(saveObj._id)

        saveObj = null
    }

    const count = await PostSave.countDocuments({
        post_id,
    })

    return {
        post_id: post_id,
        saved: !!saveObj,
        count: count,
    }
}