import { UserFollow } from "@db_models"

export default async (payload = {}) => {
    const { from_user_id, limit = 10, offset = 0 } = payload

    // TODO: Sort by latest history interaction

    // get all the users that are following
    let followingUsersIds = await UserFollow.find({
        user_id: from_user_id,
    })
    // .skip(offset)
    // .limit(limit)

    followingUsersIds = followingUsersIds.map((follow) => {
        return follow.to
    })

    const searchResult = await global.engine.ws.find.manyById(followingUsersIds)

    // TODO: Calculate last session duration or last activity at
    return searchResult.map((user) => {
        return {
            _id: user.user_id,
            username: user.username,
        }
    })
}