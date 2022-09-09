import { Post, User } from "../../../models"

export default async (payload) => {
    let {
        from_user_id,
        for_user_id,
        feedTrimIndex = 0,
        feedLimit = 20,
    } = payload

    let query = {}

    if (from_user_id) {
        query.user_id = from_user_id
    }

    // make sure that sort by date descending
    // trim index is used to get the last n posts
    let posts = await Post.find(query)
        .sort({ created_at: -1 })
        .skip(feedTrimIndex)
        .limit(feedLimit)

    // fetch and add user data to each post
    posts = posts.map(async (post, index) => {
        const user = await User.findById(post.user_id)

        if (feedTrimIndex > 0) {
            index = Number(feedTrimIndex) + Number(index)
        }

        return {
            ...post.toObject(),
            user: user.toObject(),
            key: index,
        }
    })

    posts = await Promise.all(posts)

    return posts
}