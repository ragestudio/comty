import { PostLike } from "@models"

export default async (payload) => {
    let { post_id, user_id, to } = payload

    let likeObj = await PostLike.findOne({
        post_id,
        user_id,
    }).catch(() => false)

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

    global.websocket_instance.io.emit(`post.${post_id}.likes.update`, {
        to,
        post_id,
        user_id,
    })

    return likeObj
}