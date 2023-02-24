export class MusicModel {
    static get bridge() {
        return window.app?.cores.api.withEndpoints("main")
    }

    static async createSpaceRoom() {
        const { data } = await app.cores.api.customRequest("main", {
            method: "post",
            url: `/music/create_space_room`,
        })

        return data
    }
}