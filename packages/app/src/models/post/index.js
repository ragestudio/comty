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
}