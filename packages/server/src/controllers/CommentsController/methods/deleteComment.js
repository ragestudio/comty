import { Comment } from "../../../models"

export default async (payload) => {
    const { comment_id } = payload

    if (!comment_id) {
        throw new Error("Missing comment_id")
    }

    const comment = await Comment.findById(comment_id)

    if (!comment) {
        throw new Error("Comment not found")
    }

    await comment.delete()

    global.wsInterface.io.emit(`comment.delete.${comment_id}`)
    global.wsInterface.io.emit(`post.delete.comment.${comment.parent_id.toString()}`, comment_id)

    return comment
}
