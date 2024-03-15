import { UserFollow } from "@db_models"

import GetPostData from "./data"

export default async (payload = {}) => {
    let {
        user_id,
        trim,
        limit,
    } = payload

    let query = {}

    //TODO: include posts from groups
    //TODO: include promotional posts 
    if (user_id) {
        const from_users = []

        from_users.push(user_id)

        // get post from users that the user follows
        const followingUsers = await UserFollow.find({
            user_id: user_id
        })

        const followingUserIds = followingUsers.map((followingUser) => followingUser.to)

        from_users.push(...followingUserIds)

        query.user_id = {
            $in: from_users
        }
    }

    const posts = await GetPostData({
        for_user_id: user_id,
        trim,
        limit,
        query: query,
    })

    return posts
}