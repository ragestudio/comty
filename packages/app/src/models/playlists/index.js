export default class PlaylistsModel {
    static async putPlaylist(payload) {
        if (!payload) {
            throw new Error("Payload is required")
        }

        const { data } = await app.cores.api.customRequest({
            method: "PUT",
            url: `/playlist`,
            data: payload,
        })

        return data
    }

    static async getPlaylist(id) {
        const { data } = await app.cores.api.customRequest({
            method: "GET",
            url: `/playlist/data/${id}`,
        })

        return data
    }

    static async getMyReleases() {
        const { data } = await app.cores.api.customRequest({
            method: "GET",
            url: `/playlist/self`,
        })

        return data
    }

    static async deletePlaylist(id) {
        if (!id) {
            throw new Error("ID is required")
        }

        const { data } = await app.cores.api.customRequest({
            method: "DELETE",
            url: `/playlist/${id}`,
        })

        return data
    }
}