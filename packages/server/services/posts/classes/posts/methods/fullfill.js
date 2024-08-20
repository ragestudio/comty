import { User, PostLike, PostSave, Post } from "@db_models"

export default async (payload = {}) => {
    let {
        posts,
        for_user_id,
    } = payload

    if (!Array.isArray(posts)) {
        posts = [posts]
    }

    if (posts.every((post) => !post)) {
        return []
    }

    let postsSavesIds = []

    if (for_user_id) {
        const postsSaves = await PostSave.find({ user_id: for_user_id })
            .sort({ saved_at: -1 })

        postsSavesIds = postsSaves.map((postSave) => postSave.post_id)
    }

    let [usersData, likesData] = await Promise.all([
        User.find({
            _id: {
                $in: posts.map((post) => post.user_id)
            }
        }).catch(() => { }),
        PostLike.find({
            post_id: {
                $in: posts.map((post) => post._id)
            }
        }).catch(() => []),
    ])

    // wrap likesData by post_id
    likesData = likesData.reduce((acc, like) => {
        if (!acc[like.post_id]) {
            acc[like.post_id] = []
        }

        acc[like.post_id].push(like)

        return acc
    }, {})

    posts = await Promise.all(posts.map(async (post, index) => {
        if (typeof post.toObject === "function") {
            post = post.toObject()
        }

        let user = usersData.find((user) => user._id.toString() === post.user_id.toString())

        if (!user) {
            user = {
                _deleted: true,
                username: "Deleted user",
            }
        }

        if (post.reply_to) {
            post.reply_to_data = await Post.findById(post.reply_to)

            if (post.reply_to_data) {
                post.reply_to_data = post.reply_to_data.toObject()

                const replyUserData = await User.findById(post.reply_to_data.user_id)

                post.reply_to_data.user = replyUserData.toObject()
            }
        }

        post.hasReplies = await Post.countDocuments({ reply_to: post._id })

        let likes = likesData[post._id.toString()] ?? []

        post.countLikes = likes.length

        if (for_user_id) {
            post.isLiked = likes.some((like) => like.user_id.toString() === for_user_id)
            post.isSaved = postsSavesIds.includes(post._id.toString())
        }

        return {
            ...post,
            user,
        }
    }))

    return posts
}