export default class FeedModel {
    static async getMusicFeed({ trim, limit } = {}) {
        const { data } = await app.cores.api.customRequest({
            method: "GET",
            url: `/feed/music`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async getGlobalMusicFeed({ trim, limit } = {}) {
        const { data } = await app.cores.api.customRequest({
            method: "GET",
            url: `/feed/music/global`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async getTimelineFeed({ trim, limit } = {}) {
        const { data } = await app.cores.api.customRequest({
            method: "GET",
            url: `/feed/timeline`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async getPostsFeed({ trim, limit } = {}) {
        const { data } = await app.cores.api.customRequest({
            method: "GET",
            url: `/feed/posts`,
            params: {
                trim: trim ?? 0,
                limit: limit ?? window.app.cores.settings.get("feed_max_fetch"),
            }
        })

        return data
    }

    static async getPlaylistsFeed({ trim, limit } = {}) {
        const { data } = await app.cores.api.customRequest({
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
        const { data } = await app.cores.api.customRequest({
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