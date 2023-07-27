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

    static search = async (keywords, {
        limit = 5,
        offset = 0,
        useTidal = false,
    }) => {
        const { data } = await request({
            instance: MusicModel.api_instance,
            method: "GET",
            url: `/search`,
            params: {
                keywords,
                limit,
                offset,
                useTidal,
            }
        })

        return data
    }
}