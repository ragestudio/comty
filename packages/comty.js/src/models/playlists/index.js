import request from "../../handlers/request"

export default class PlaylistsModel {
    static putPlaylist = async (payload) => {
        if (!payload) {
            throw new Error("Payload is required")
        }

        const { data } = await request({
            method: "PUT",
            url: `/playlist`,
            data: payload,
        })

        return data
    }

    static getPlaylist = async (id) => {
        const { data } = await request({
            method: "GET",
            url: `/playlist/data/${id}`,
        })

        return data
    }

    static getMyReleases = async () => {
        const { data } = await request({
            method: "GET",
            url: `/playlist/self`,
        })

        return data
    }

    static deletePlaylist = async (id) => {
        if (!id) {
            throw new Error("ID is required")
        }

        const { data } = await request({
            method: "DELETE",
            url: `/playlist/${id}`,
        })

        return data
    }
}