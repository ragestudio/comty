import { Post, User, Comment, SavedPost } from "../../../models"

export default async (payload) => {
    let {
        from_user_id,
        for_user_id,
        post_id,
        query = {},
        skip = 0,
        limit = 20,
        sort = { created_at: -1 },
        savedOnly = false,
    } = payload

    let posts = []
    let savedPostsIds = []

    // if for_user_id is provided, get saved posts
    if (for_user_id) {
        const savedPosts = await SavedPost.find({ user_id: for_user_id })
            .sort({ saved_at: -1 })

        savedPostsIds = savedPosts.map((savedPost) => savedPost.post_id)
    }

    // if from_user_id is provided, get posts from that user
    if (from_user_id) {
        query.user_id = from_user_id
    }

    // if savedOnly is true,set to query to get only saved posts
    if (savedOnly) {
        query._id = { $in: savedPostsIds }
    }

    if (post_id) {
        const post = await Post.findById(post_id).catch(() => false)

        posts = [post]
    } else {
        posts = await Post.find({ ...query })
            .sort(sort)
            .skip(skip)
            .limit(limit)
    }

    // short posts if is savedOnly argument
    if (savedOnly) {
        posts.sort((a, b) => {
            return (
                savedPostsIds.indexOf(a._id.toString()) -
                savedPostsIds.indexOf(b._id.toString())
            )
        })
    }

    // fullfill data
    posts = posts.map(async (post, index) => {
        post = post.toObject()

        post.key = Number(skip) + Number(index)

        let user = await User.findById(post.user_id).catch(() => false)

        if (!user) {
            user = {
                username: "Deleted user",
            }
        }

        let comments = await Comment.find({ parent_id: post._id.toString() })
            .select("_id")
            .catch(() => false)

        if (!comments) {
            comments = []
        }

        post.comments = comments

        if (for_user_id) {
            post.isLiked = post.likes.includes(for_user_id)
            post.isSaved = savedPostsIds.includes(post._id.toString())
        }

        return {
            key: Number(skip) + Number(index),
            ...post,
            comments: comments.map((comment) => comment._id.toString()),
            user,
        }
    })

    posts = await Promise.all(posts)

    // if post_id is specified, return only one post
    if (post_id) {
        return posts[0]
    }

    return posts
}