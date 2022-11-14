export default class Post {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
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

        const request = Post.bridge.get.post(undefined, {
            post_id,
        })

        return request
    }

    static async sendComment({ post_id, comment }) {
        if (!post_id || !comment) {
            throw new Error("Post ID and/or comment are required")
        }

        const request = await app.api.customRequest("main", {
            method: "POST",
            url: `/post/${post_id}/comment`,
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

        const request = await app.api.customRequest("main", {
            method: "DELETE",
            url: `/post/${post_id}/comment/${comment_id}`,
        })

        return request
    }

    static async getExplorePosts({ trim, limit }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        const request = Post.bridge.get.explorePosts(undefined, {
            trim: trim ?? 0,
            limit: limit ?? window.app.settings.get("feed_max_fetch"),
        })

        return request
    }

    static async getFeed({ trim, limit }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        const request = Post.bridge.get.feed(undefined, {
            trim: trim ?? 0,
            limit: limit ?? window.app.settings.get("feed_max_fetch"),
        })

        return request
    }

    static async getSavedPosts({ trim, limit }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        const request = Post.bridge.get.savedPosts(undefined, {
            trim: trim ?? 0,
            limit: limit ?? window.app.settings.get("feed_max_fetch"),
        })

        return request
    }

    static async getUserPosts({ user_id, trim, limit }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        if (!user_id) {
            // use current user_id
            user_id = app.userData?._id
        }

        const request = Post.bridge.get.userPosts(undefined, {
            user_id,
            trim: trim ?? 0,
            limit: limit ?? window.app.settings.get("feed_max_fetch"),
        })

        return request
    }
}