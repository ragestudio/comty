import { User, Comment } from "../../../models"

export default async (payload = {}) => {
    const { parent_id } = payload

    if (!parent_id) {
        throw new Error("Missing parent_id")
    }

    // get comments by descending order
    let comments = await Comment.find({ parent_id: parent_id })
        .sort({ created_at: -1 })

    // fullfill comments with user data
    comments = await Promise.all(comments.map(async comment => {
        const user = await User.findById(comment.user_id)

        return {
            ...comment.toObject(),
            user: user.toObject(),
        }
    }))

    return comments
}