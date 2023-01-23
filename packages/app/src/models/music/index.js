export class MusicModel {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static async createSpaceRoom() {
        const { data } = await app.api.customRequest("main", {
            method: "post",
            url: `/music/create_space_room`,
        })

        return data
    }
}