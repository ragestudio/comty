import { User, UserFollow } from "@db_models"

export default async (payload = {}) => {
    const { user_id, from_user_id } = payload

    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    let user = await User.findOne({
        _id: user_id,
    }).catch((err) => {
        return false
    })

    if (!user) {
        throw new OperationError(404, "User not found")
    }

    user = user.toObject()

    if (from_user_id) {
        const isFollowed = await UserFollow.findOne({
            user_id: from_user_id,
            to: user_id,
        }).catch(() => false)

        user.following = !!isFollowed
    }

    return user
}