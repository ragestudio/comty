import { User, Comment, PostLike, SavedPost } from "@models"

export default async (payload) => {
    let {
        posts,
        for_user_id,
        skip = 0,
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

    posts = posts.map(async (post, index) => {
        post = post.toObject()

        let user = await User.findById(post.user_id).catch(() => false)

        if (!user) {
            user = {
                username: "Deleted user",
            }
        }

        let likes = await PostLike.find({ post_id: post._id.toString() })
            .catch(() => [])

        post.countLikes = likes.length

        let comments = await Comment.find({ parent_id: post._id.toString() })
            .select("_id")
            .catch(() => false)

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
    })

    posts = await Promise.all(posts)

    return posts
}