export default class Post {
    static get bridge() {
        return window.app?.cores.api.withEndpoints("main")
    }

    static get maxPostTextLength() {
        return 3200
    }

    static get maxCommentLength() {
        return 1200
    }

    static async getPost({ post_id }) {
        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/posts/post/${post_id}`,
        })

        return data
    }

    static async getPostComments({ post_id }) {
        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/comments/post/${post_id}`,
        })

        return data
    }

    static async sendComment({ post_id, comment }) {
        if (!post_id || !comment) {
            throw new Error("Post ID and/or comment are required")
        }

        const request = await app.cores.apies.api.customRequest("main", {
            method: "POST",
            url: `/comments/post/${post_id}`,
            data: {
                message: comment,
            },
        })

        return request
    }

    static async deleteComment({ post_id, comment_id }) {
        if (!post_id || !comment_id) {
            throw new Error("Post ID and/or comment ID are required")
        }

        const request = await app.cores.apies.api.customRequest("main", {
            method: "DELETE",
            url: `/comments/post/${post_id}/${comment_id}`,
        })

        return request
    }

    static async getExplorePosts({ trim, limit }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/posts/explore`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async getSavedPosts({ trim, limit }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/posts/saved`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async getUserPosts({ user_id, trim, limit }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        if (!user_id) {
            // use current user_id
            user_id = app.userData?._id
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/posts/user/${user_id}`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async toogleLike({ post_id }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "POST",
            url: `/posts/${post_id}/toogle_like`,
        })

        return data
    }

    static async toogleSave({ post_id }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "POST",
            url: `/posts/${post_id}/toogle_save`,
        })

        return data
    }

    static async create(payload) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "POST",
            url: `/posts/new`,
            data: payload,
        })

        return data
    }

    static async deletePost({ post_id }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        if (!post_id) {
            throw new Error("Post ID is required")
        }

        const { data } = await app.cores.api.customRequest("main", {
            method: "DELETE",
            url: `/posts/${post_id}`,
        })

        return data
    }
}