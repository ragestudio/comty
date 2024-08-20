import { User, UserFollow } from "@db_models"

export default async (payload = {}) => {
    const { user_id, data = false, limit = 50, offset = 0 } = payload

    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    if (data) {
        let followers = await UserFollow.find({
            to: user_id
        })
            .limit(limit)
            .skip(offset)

        const followersData = await User.find({
            _id: {
                $in: followers.map((follow) => {
                    return follow.user_id
                })
            }
        })

        return followersData
    } else {
        const count = await UserFollow.countDocuments({
            to: user_id
        })

        return {
            count
        }
    }
}