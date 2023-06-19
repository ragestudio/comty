import { User, Comment, PostLike, SavedPost } from "@models"

export default async (payload) => {
    let {
        posts,
        for_user_id,
    } = payload

    if (!Array.isArray(posts)) {
        posts = [posts]
    }

    let savedPostsIds = []

    if (for_user_id) {
        const savedPosts = await SavedPost.find({ user_id: for_user_id })
            .sort({ saved_at: -1 })

        savedPostsIds = savedPosts.map((savedPost) => savedPost.post_id)
    }

    let [usersData, likesData, commentsData] = await Promise.all([
        User.find({
            _id: {
                $in: posts.map((post) => post.user_id)
            }
        }),
        PostLike.find({
            post_id: {
                $in: posts.map((post) => post._id)
            }
        }).catch(() => []),
        Comment.find({
            parent_id: {
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

    // wrap commentsData by post_id
    commentsData = commentsData.reduce((acc, comment) => {
        if (!acc[comment.parent_id]) {
            acc[comment.parent_id] = []
        }

        acc[comment.parent_id].push(comment)

        return acc
    }, {})

    posts = await Promise.all(posts.map(async (post, index) => {
        post = post.toObject()

        let user = usersData.find((user) => user._id.toString() === post.user_id.toString())

        if (!user) {
            user = {
                username: "Deleted user",
            }
        }

        let likes = likesData[post._id.toString()] ?? []

        post.countLikes = likes.length

        let comments = commentsData[post._id.toString()] ?? []

        post.countComments = comments.length

        if (for_user_id) {
            post.isLiked = likes.some((like) => like.user_id.toString() === for_user_id)
            post.isSaved = savedPostsIds.includes(post._id.toString())
        }

        return {
            ...post,
            comments: comments.map((comment) => comment._id.toString()),
            user,
        }
    }))

    return posts
}