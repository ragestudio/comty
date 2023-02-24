export default class Livestream {
    static async getStreamingKey() {
        const request = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/tv/streaming/key`,
        })

        return request.data
    }

    static async regenerateStreamingKey() {
        const request = await app.cores.api.customRequest("main", {
            method: "POST",
            url: `/tv/streaming/key/regenerate`,

        })

        return request.data
    }

    static async updateLivestreamInfo(payload) {
        const request = await app.cores.api.customRequest("main", {
            method: "POST",
            url: `/tv/stream/info`,
            data: {
                ...payload
            },
        })

        return request.data
    }

    static async getCategories(key) {
        const request = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/tv/streaming/categories`,
            params: {
                key,
            }
        })

        return request.data
    }

    static async getStreamInfo(payload) {
        let { username } = payload ?? {}

        if (!username) {
            username = app.userData.username
        }

        const request = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/tv/stream/info`,
            params: {
                username,
            }
        })

        return request.data
    }

    static async getLivestream({ username }) {
        if (!username) {
            throw new Error("Username is required")
        }

        let request = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/tv/streams`,
            params: {
                username,
            }
        })

        return request.data
    }

    static async getAddresses() {
        const request = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/tv/streaming/addresses`,
        })

        return request.data
    }

    static async getLivestreams() {
        const request = await app.cores.api.customRequest("main", {
            method: "GET",
            url: `/tv/streams`,
        })

        return request.data
    }
}