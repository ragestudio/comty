import { User, Comment } from "@db_models"

export default async (payload) => {
    const { parent_id, message, user_id } = payload

    if (!parent_id) {
        throw new Error("Missing parent_id")
    }

    if (!message) {
        throw new Error("Missing message")
    }

    if (!user_id) {
        throw new Error("Missing user_id")
    }

    const comment = new Comment({
        user_id: user_id,
        parent_id: parent_id,
        message: message,
    })

    await comment.save()

    const userData = await User.findById(user_id)

    global.engine.ws.io.of("/").emit(`post.new.comment.${parent_id}`, {
        ...comment.toObject(),
        user: userData.toObject(),
    })

    return comment
}