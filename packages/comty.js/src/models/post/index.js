import request from "../../handlers/request"
import Settings from "../../helpers/withSettings"

export default class Post {
    static get maxPostTextLength() {
        return 3200
    }

    static get maxCommentLength() {
        return 1200
    }

    static getPostingPolicy = async () => {
        const { data } = await request({
            method: "GET",
            url: "/posting_policy",
        })

        return data
    }

    static getPost = async ({ post_id }) => {
        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await request({
            method: "GET",
            url: `/posts/post/${post_id}`,
        })

        return data
    }

    static getPostComments = async ({ post_id }) => {
        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await request({
            method: "GET",
            url: `/comments/post/${post_id}`,
        })

        return data
    }

    static sendComment = async ({ post_id, comment }) => {
        if (!post_id || !comment) {
            throw new Error("Post ID and/or comment are required")
        }

        const { data } = await request({
            method: "POST",
            url: `/comments/post/${post_id}`,
            data: {
                message: comment,
            },
        })

        return data
    }

    static deleteComment = async ({ post_id, comment_id }) => {
        if (!post_id || !comment_id) {
            throw new Error("Post ID and/or comment ID are required")
        }

        const { data } = await request({
            method: "DELETE",
            url: `/comments/post/${post_id}/${comment_id}`,
        })

        return data
    }

    static getExplorePosts = async ({ trim, limit }) => {
        const { data } = await request({
            method: "GET",
            url: `/posts/explore`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? Settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static getSavedPosts = async ({ trim, limit }) => {
        const { data } = await request({
            method: "GET",
            url: `/posts/saved`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? Settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static getUserPosts = async ({ user_id, trim, limit }) => {
        if (!user_id) {
            // use current user_id
            user_id = app.userData?._id
        }

        const { data } = await request({
            method: "GET",
            url: `/posts/user/${user_id}`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? Settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static toogleLike = async ({ post_id }) => {
        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await request({
            method: "POST",
            url: `/posts/${post_id}/toogle_like`,
        })

        return data
    }

    static toogleSave = async ({ post_id }) => {
        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await request({
            method: "POST",
            url: `/posts/${post_id}/toogle_save`,
        })

        return data
    }

    static create = async (payload) => {
        const { data } = await request({
            method: "POST",
            url: `/posts/new`,
            data: payload,
        })

        return data
    }

    static deletePost = async ({ post_id }) => {
        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await request({
            method: "DELETE",
            url: `/posts/${post_id}`,
        })

        return data
    }
}