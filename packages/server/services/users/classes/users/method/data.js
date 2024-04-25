import { User, UserFollow } from "@db_models"

export default async (payload = {}) => {
    const { user_id, from_user_id } = payload

    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    let data = null

    if (Array.isArray(user_id)) {
        data = await User.find({
            _id: {
                $in: user_id,
            },
        }).catch((err) => {
            return false
        })

        data = data.map((user) => {
            user = user.toObject()
        })

        if (from_user_id) {
            const following = await UserFollow.find({
                to: {
                    $in: ids,
                },
                user_id: from_user_id,
            }).catch(() => false)

            following.forEach((follow) => {
                const userIndex = data.findIndex((user) => {
                    return user._id === follow.to
                })

                if (userIndex > -1) {
                    data[userIndex].following = true
                }
            })
        }
    } else {
        data = await User.findOne({
            _id: user_id,
        }).catch((err) => {
            return false
        })

        if (!data) {
            throw new OperationError(404, "User not found")
        }

        data = data.toObject()

        if (from_user_id) {
            const isFollowed = await UserFollow.findOne({
                user_id: from_user_id,
                to: user_id,
            }).catch(() => false)

            data.following = !!isFollowed
        }
    }

    return data
}