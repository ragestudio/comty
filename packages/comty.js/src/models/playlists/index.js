import request from "../../handlers/request"

export default class PlaylistsModel {
    static get api_instance() {
        return globalThis.__comty_shared_state.instances["music"]
    }

    static refreshTrackCache = async (track_id) => {
        if (!track_id) {
            throw new Error("Track ID is required")
        }

        const { data } = await request({
            instance: PlaylistsModel.api_instance,
            method: "POST",
            url: `/tracks/${track_id}/refresh-cache`,
        })

        return data
    }

    static putPlaylist = async (payload) => {
        if (!payload) {
            throw new Error("Payload is required")
        }

        const { data } = await request({
            instance: PlaylistsModel.api_instance,
            method: "PUT",
            url: `/playlists/playlist`,
            data: payload,
        })

        return data
    }

    static deletePlaylist = async (id) => {
        if (!id) {
            throw new Error("ID is required")
        }

        const { data } = await request({
            instance: PlaylistsModel.api_instance,
            method: "DELETE",
            url: `/playlists/${id}`,
        })

        return data
    }

    static getTrack = async (id) => {
        const { data } = await request({
            instance: PlaylistsModel.api_instance,
            method: "GET",
            url: `/tracks/${id}/data`,
        })

        return data
    }

    static getTracks = async (ids) => {
        const { data } = await request({
            instance: PlaylistsModel.api_instance,
            method: "GET",
            url: `/tracks/many`,
            params: {
                ids,
            }
        })

        return data
    }

    static getPlaylist = async (id) => {
        const { data } = await request({
            instance: PlaylistsModel.api_instance,
            method: "GET",
            url: `/playlists/${id}/data`,
        })

        return data
    }

    static search = async (keywords) => {
        const { data } = await request({
            instance: PlaylistsModel.api_instance,
            method: "GET",
            url: `/playlists/search`,
            params: {
                keywords,
            }
        })

        return data
    }

    static getMyReleases = async (keywords) => {
        const { data } = await request({
            instance: PlaylistsModel.api_instance,
            method: "GET",
            url: `/playlists/self`,
            params: {
                keywords,
            }
        })

        return data
    }
}