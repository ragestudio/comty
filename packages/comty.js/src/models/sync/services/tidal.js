import request from "../../../handlers/request"

export default class TidalService {
    static get api_instance() {
        return globalThis.__comty_shared_state.instances["sync"]
    }

    static async linkAccount() {
        if (!window) {
            throw new Error("This method is only available in the browser.")
        }

        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/create_link`,
        })

        if (data.auth_url) {
            window.open(data.auth_url, "_blank")
        }

        return data
    }

    static async unlinkAccount() {
        if (!window) {
            throw new Error("This method is only available in the browser.")
        }

        const { data } = await request({
            instance: TidalService.api_instance,
            method: "POST",
            url: `/services/tidal/delete_link`,
        })

        return data
    }

    static async isActive() {
        if (!window) {
            throw new Error("This method is only available in the browser.")
        }

        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/is_active`,
        })

        return data
    }

    static async getCurrentUser() {
        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/current`,
        })

        return data
    }

    static async getPlaybackUrl(track_id) {
        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/playback/${track_id}`,
        })

        return data
    }

    static async getTrackManifest(track_id) {
        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/manifest/${track_id}`,
        })

        return data
    }

    static async getMyFavoriteTracks({
        limit = 50,
        offset = 0,
    } = {}) {
        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/favorites/tracks`,
            params: {
                limit,
                offset,
            },
        })

        return data
    }

    static async getMyFavoritePlaylists({
        limit = 50,
        offset = 0,
    } = {}) {
        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/favorites/playlists`,
            params: {
                limit,
                offset,
            },
        })

        return data
    }

    static async getPlaylistData({
        playlist_id,

        resolve_items = false,
        limit = 50,
        offset = 0,
    }) {
        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/playlist/${playlist_id}/data`,
            params: {
                limit,
                offset,
                resolve_items,
            },
        })

        return data
    }

    static async getPlaylistItems({
        playlist_id,

        resolve_items = false,
        limit = 50,
        offset = 0,
    }) {
        const { data } = await request({
            instance: TidalService.api_instance,
            method: "GET",
            url: `/services/tidal/playlist/${playlist_id}/items`,
            params: {
                limit,
                offset,
                resolve_items,
            },
        })

        return data
    }

    static async toggleTrackLike({
        track_id,
        to,
    }) {
        const { data } = await request({
            instance: TidalService.api_instance,
            method: to ? "POST" : "DELETE",
            url: `/services/tidal/track/${track_id}/like`,
        })

        return data
    }
}