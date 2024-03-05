import axios from "axios"

export default class VRCApi {
    static base_api_hostname = "https://api.vrchat.cloud/api/1"

    static get interface() {
        return axios.create({
            baseURL: VRCApi.base_api_hostname,
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36",
            }
        })
    }

    static async auth({ username, password }, access_token) {
        username = encodeURIComponent(username)
        password = encodeURIComponent(password)

        let headers = {
            "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
        }

        if (access_token) {
            delete headers["Authorization"]
            headers["Cookie"] = `${access_token}`
        }

        const response = await VRCApi.interface({
            method: "GET",
            url: "/auth/user",
            headers,
        })

        if (!access_token && response.headers["set-cookie"]) {
            response.data.cookie = response.headers["set-cookie"][0].split(";")[0]
        }

        return response.data
    }

    static async verifyOtp({ type, code }, access_token) {
        const response = await VRCApi.interface({
            method: "POST",
            url: `/auth/twofactorauth/${type}/verify`,
            data: {
                code: code
            },
            headers: {
                "Cookie": `${access_token}`
            },
        })

        if (!access_token && response.headers["set-cookie"]) {
            response.data.cookie = response.headers["set-cookie"][0].split(";")[0]
        }

        return response.data
    }
}