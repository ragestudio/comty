import { Post, PostLike, PostSave } from "@db_models"

export default async (payload = {}) => {
    let {
        post_id
    } = payload

    if (!post_id) {
        throw new OperationError(400, "Missing post_id")
    }

    await Post.deleteOne({
        _id: post_id,
    }).catch((err) => {
        throw new OperationError(500, `An error has occurred: ${err.message}`)
    })

    // search for likes
    await PostLike.deleteMany({
        post_id: post_id,
    }).catch((err) => {
        throw new OperationError(500, `An error has occurred: ${err.message}`)
    })

    // deleted from saved
    await PostSave.deleteMany({
        post_id: post_id,
    }).catch((err) => {
        throw new OperationError(500, `An error has occurred: ${err.message}`)
    })

    global.rtengine.io.of("/").emit(`post.delete`, post_id)
    global.rtengine.io.of("/").emit(`post.delete.${post_id}`, post_id)

    return {
        deleted: true,
    }
}