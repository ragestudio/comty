export default class FeedModel {
    static get bridge() {
        return window.app?.cores.api.withEndpoints()
    }

    static async getPostsFeed({ trim, limit }) {
        if (!FeedModel.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/feed/posts`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async getPlaylistsFeed({ trim, limit }) {
        if (!FeedModel.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/feed/playlists`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async search(keywords, params = {}) {
        if (!FeedModel.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.cores.api.customRequest( {
            method: "GET",
            url: `/search`,
            params: {
                keywords: keywords,
                params: params
            }
        })

        return data
    }
}