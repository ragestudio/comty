import { User, UserFollow } from "@models"

// TODO: Sort follows by last activity
export default async (payload = {}) => {
    const from_user_id = payload.from_user_id

    if (!from_user_id) {
        throw new Error("Missing from_user_id")
    }

    let mutuals = []

    // load friends and recents users
    const follows = await UserFollow.find({
        user_id: from_user_id,
    })
        .limit(15)

    mutuals = await UserFollow.find({
        user_id: follows.map((follow) => follow.to.toString()),
        to: from_user_id,
    })

    // load data user
    mutuals = await User.find({
        _id: mutuals.map((mutual) => mutual.user_id.toString()),
    })

    return mutuals
}