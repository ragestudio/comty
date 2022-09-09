import { Post, User } from "../../../models"

export default async (payload) => {
    const { user_id, message, additions } = payload

    const userData = await User.findById(user_id)

    const post = new Post({
        user_id: typeof user_id === "object" ? user_id.toString() : user_id,
        message: String(message).toString(),
        additions: additions ?? [],
        created_at: new Date().getTime(),
    })

    await post.save()

    global.wsInterface.io.emit(`post.new`, {
        ...post.toObject(),
        user: userData.toObject(),
    })
    global.wsInterface.io.emit(`post.new.${post.user_id}`, {
        ...post.toObject(),
        user: userData.toObject(),
    })

    return post
}