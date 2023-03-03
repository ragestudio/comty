import { User, UserFollow } from "@models"

export default async (payload) => {
    if (typeof payload.user_id === "undefined") {
        throw new Error("No user_id provided")
    }
    if (typeof payload.to === "undefined") {
        throw new Error("No to provided")
    }

    const user = await User.findById(payload.user_id)

    if (!user) {
        throw new Error("User not found")
    }

    const follow = await UserFollow.findOne({
        user_id: payload.user_id,
        to: payload.to,
    })

    if (!follow) {
        throw new Error("Not following")
    }

    await follow.remove()

    global.websocket_instance.io.emit(`user.unfollow`, {
        ...user.toObject(),
    })
    global.websocket_instance.io.emit(`user.unfollow.${payload.user_id}`, {
        ...user.toObject(),
    })

    const followers = await UserFollow.find({
        to: payload.to,
    })

    return {
        following: false,
        followers: followers,
    }
}