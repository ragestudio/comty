import { Post, UserFollow } from "../../../models"

import fullfillPostsData from "../../../utils/fullfillPostsData"

export default async (payload) => {
    const {
        for_user_id,
        limit = 20,
        skip = 0,
    } = payload

    // get post from users that the user follows
    const followingUsers = await UserFollow.find({
        user_id: for_user_id
    })

    const followingUserIds = followingUsers.map((followingUser) => followingUser.to)

    const fetchPostsFromIds = [
        for_user_id,
        ...followingUserIds,
    ]

    let posts = await Post.find({
        user_id: { $in: fetchPostsFromIds }
    })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)

    // fullfill data
    posts = await fullfillPostsData({
        posts,
        for_user_id,
        skip,
    })

    return posts
}