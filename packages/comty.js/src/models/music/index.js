import request from "../../handlers/request"

export default class MusicModel {
    static get api_instance() {
        return globalThis.__comty_shared_state.instances["music"]
    }

    static getFavorites = async () => {
        const { data } = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/tracks/liked`,
        })

        return data
    }
}