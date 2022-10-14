export default class Livestream {
    static get bridge() {
        return window.app?.api.withEndpoints("main")
    }

    static async getLivestream({ username }) {
        if (!username) {
            throw new Error("Username is required")
        }

        let request = await app.api.customRequest("main", {
            method: "GET",
            url: `/streaming/${username}`,
        })

        request = request.data

        return request
    }

    static async getLivestreams() {
        const request = await Livestream.bridge.get.streams()

        return request
    }
}