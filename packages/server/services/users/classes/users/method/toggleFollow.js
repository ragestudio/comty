import { User, UserFollow } from "@db_models"

export default async (payload = {}) => {
    let { user_id, from_user_id, to } = payload

    if (typeof from_user_id === "undefined") {
        throw new OperationError(400, "[from_user_id] not provided")
    }
    if (typeof user_id === "undefined") {
        throw new OperationError(400, "[user_id] not provided")
    }

    const user = await User.findById(user_id).catch((err) => {
        return false
    })

    if (!user) {
        throw new OperationError(404, "User not found")
    }

    let followObj = await UserFollow.findOne({
        user_id: from_user_id,
        to: user_id,
    }).catch((err) => {
        return false
    })

    if (typeof to === "undefined") {
        if (followObj) {
            to = false
        } else {
            to = true
        }
    }

    if (to === true) {
        followObj = new UserFollow({
            user_id: from_user_id,
            to: user_id,
        })

        await followObj.save()
    } else {
        await UserFollow.findByIdAndDelete(followObj._id)
    }

    return {
        following: to,
        count: await UserFollow.countDocuments({ to: user_id }),
    }
}