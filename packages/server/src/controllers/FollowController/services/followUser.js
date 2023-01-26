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

    if (follow) {
        throw new Error("Already following")
    }

    const newFollow = await UserFollow.create({
        user_id: payload.user_id,
        to: payload.to,
    })

    await newFollow.save()

    global.wsInterface.io.emit(`user.follow`, {
        ...user.toObject(),
    })
    global.wsInterface.io.emit(`user.follow.${payload.user_id}`, {
        ...user.toObject(),
    })

    const followers = await UserFollow.find({
        to: payload.to,
    })

    return {
        following: true,
        followers: followers,
    }
}