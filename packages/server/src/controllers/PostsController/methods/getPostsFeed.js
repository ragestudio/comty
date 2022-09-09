import { Post, User, SavedPost } from "../../../models"

export default async (payload) => {
    let {
        from_user_id,
        for_user_id,
        feedTrimIndex = 0,
        feedLimit = 20,
        savedOnly = false,
    } = payload

    let query = {}
    let savedPostsIds = []

    if (from_user_id) {
        query.user_id = from_user_id
    }

    // short posts in order of `saved_at`. 
    const savedPosts = await SavedPost.find({ user_id: for_user_id })
        .sort({ saved_at: -1 })

    savedPostsIds = savedPosts.map((savedPost) => savedPost.post_id)

    if (savedOnly) {
        query._id = { $in: savedPostsIds }
    }

    let posts = []

    if (savedOnly) {
        posts = await Post.find({
            _id: { $in: savedPostsIds },
        })
            .skip(feedTrimIndex)
            .limit(feedLimit)

        posts.sort((a, b) => {
            return (
                savedPostsIds.indexOf(a._id.toString()) -
                savedPostsIds.indexOf(b._id.toString())
            )
        })
    } else {
        // make sure that sort by date descending
        // trim index is used to get the last n posts
        posts = await Post.find(query)
            .sort({ created_at: -1 })
            .skip(feedTrimIndex)
            .limit(feedLimit)
    }

    // fetch and add user data to each post
    posts = posts.map(async (post, index) => {
        const user = await User.findById(post.user_id)

        if (feedTrimIndex > 0) {
            index = Number(feedTrimIndex) + Number(index)
        }

        // check if post is saved by the user
        const isSaved = savedPostsIds.includes(post._id.toString())

        return {
            ...post.toObject(),
            user: user.toObject(),
            key: index,
            isSaved,
        }
    })

    posts = await Promise.all(posts)

    return posts
}