export default class Post {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static async getPostsFeed({ trim, limit }) {
        if (!Post.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: `/feed/posts`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.settings.get("feed_max_fetch"),
            }
        })

        return data
    }
}