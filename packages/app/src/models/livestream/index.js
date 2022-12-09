export default class Livestream {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static async getStreamingKey() {
        const request = await Livestream.bridge.get.tvStreamingKey()

        return request
    }

    static async regenerateStreamingKey() {
        const request = await Livestream.bridge.post.tvRegenerateStreamingKey()

        return request
    }

    static async updateLivestreamInfo(payload) {
        const { data } = await app.api.customRequest("main", {
            method: "POST",
            url: `/tv/streaming/update_info`,
            data: {
                ...payload
            },
        })

        return data
    }

    static async getCategories() {
        const request = await Livestream.bridge.get.tvStreamingCategories()

        return request
    }

    static async getStreamInfo(payload) {
        let { username } = payload ?? {}

        if (!username) {
            username = app.userData.username
        }

        const { data } = await app.api.customRequest("main", {
            method: "GET",
            url: `/tv/stream/info`,
            params: {
                username,
            }
        })

        return data
    }

    static async getLivestream({ username }) {
        if (!username) {
            throw new Error("Username is required")
        }

        let request = await app.api.customRequest("main", {
            method: "GET",
            url: `/tv/streaming/${username}`,
        })

        request = request.data

        return request
    }

    static async getAddresses() {
        const request = await Livestream.bridge.get.tvStreamingAddresses()

        return request
    }

    static async getLivestreams() {
        const request = await Livestream.bridge.get.tvStreams()

        return request
    }
}