import { Comment } from "../../../models"
import CheckUserAdmin from "../../../lib/checkUserAdmin"

export default async (payload) => {
    const { issuer_id, comment_id } = payload

    if (!issuer_id) {
        throw new Error("Missing issuer_id")
    }

    if (!comment_id) {
        throw new Error("Missing comment_id")
    }

    const isAdmin = await CheckUserAdmin(issuer_id)

    const comment = await Comment.findById(comment_id)

    if (!comment) {
        throw new Error("Comment not found")
    }

    if (comment.user_id !== issuer_id && !isAdmin) {
        throw new Error("You can't delete this comment, cause you are not the owner.")
    }

    await comment.delete()

    global.wsInterface.io.emit(`comment.delete.${comment_id}`)
    global.wsInterface.io.emit(`post.delete.comment.${comment.parent_id.toString()}`, comment_id)

    return comment
}
