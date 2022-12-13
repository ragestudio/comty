export default class PlaylistsModel {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static async getPlaylist(id) {
        if (!PlaylistsModel.bridge) {
            throw new Error("Bridge is not available")
        }

        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: `/playlist/${id}`,
        })

        return data
    }
}