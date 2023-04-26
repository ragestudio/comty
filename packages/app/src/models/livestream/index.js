import axios from "axios"
import config from "config"

export default class Livestream {
    static instance = axios.create({
        baseURL: config.remotes.livestreamingApi,
    })

    static async deleteProfile(profile_id) {
        const request = await app.cores.api.customRequest({
            method: "DELETE",
            url: `/tv/streaming/profile`,
            data: {
                profile_id
            }
        })

        return request.data
    }

    static async postProfile(payload) {
        const request = await app.cores.api.customRequest({
            method: "POST",
            url: `/tv/streaming/profile`,
            data: payload,
        })

        return request.data
    }

    static async getProfiles() {
        const request = await app.cores.api.customRequest({
            method: "GET",
            url: `/tv/streaming/profiles`,
        })

        return request.data
    }

    static async regenerateStreamingKey(profile_id) {
        const request = await app.cores.api.customRequest({
            method: "POST",
            url: `/tv/streaming/regenerate_key`,
            data: {
                profile_id
            }
        })

        return request.data
    }

    static async getCategories(key) {
        const request = await app.cores.api.customRequest({
            method: "GET",
            url: `/tv/streaming/categories`,
            params: {
                key,
            }
        })

        return request.data
    }

    static async getLivestream(payload = {}) {
        if (!payload.username) {
            throw new Error("Username is required")
        }

        let request = await app.cores.api.customRequest({
            method: "GET",
            url: `/tv/streams`,
            params: {
                username: payload.username,
                profile_id: payload.profile_id,
            }
        })

        return request.data
    }

    static async getLivestreams() {
        const request = await app.cores.api.customRequest({
            method: "GET",
            url: `/tv/streams`,
        })

        return request.data
    }
}