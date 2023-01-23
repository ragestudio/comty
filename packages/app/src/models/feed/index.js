export default class FeedModel {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static async getPostsFeed({ trim, limit }) {
        if (!FeedModel.bridge) {
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

    static async getPlaylistsFeed({ trim, limit }) {
        if (!FeedModel.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: `/feed/playlists`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.settings.get("feed_max_fetch"),
            }
        })

        return data
    }
}