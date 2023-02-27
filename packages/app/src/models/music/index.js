export class MusicModel {
    static get bridge() {
        return window.app?.cores.api.withEndpoints()
    }

    static async createSpaceRoom() {
        const { data } = await app.cores.api.customRequest( {
            method: "post",
            url: `/music/create_space_room`,
        })

        return data
    }
}