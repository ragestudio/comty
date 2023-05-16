import request from "../../handlers/request"

export default class Livestream {
    static deleteProfile = async (profile_id) => {
        const response = await request({
            method: "DELETE",
            url: `/tv/streaming/profile`,
            data: {
                profile_id
            }
        })

        return response.data
    }

    static postProfile = async (payload) => {
        const response = await request({
            method: "POST",
            url: `/tv/streaming/profile`,
            data: payload,
        })

        return response.data
    }

    static getProfiles = async () => {
        const response = await request({
            method: "GET",
            url: `/tv/streaming/profiles`,
        })

        return response.data
    }

    static regenerateStreamingKey = async (profile_id) => {
        const response = await request({
            method: "POST",
            url: `/tv/streaming/regenerate_key`,
            data: {
                profile_id
            }
        })

        return response.data
    }

    static getCategories = async (key) => {
        const response = await request({
            method: "GET",
            url: `/tv/streaming/categories`,
            params: {
                key,
            }
        })

        return response.data
    }

    static getLivestream = async (payload = {}) => {
        if (!payload.username) {
            throw new Error("Username is required")
        }

        let response = await request({
            method: "GET",
            url: `/tv/streams`,
            params: {
                username: payload.username,
                profile_id: payload.profile_id,
            }
        })

        return response.data
    }

    static getLivestreams = async () => {
        const response = await request({
            method: "GET",
            url: `/tv/streams`,
        })

        return response.data
    }
}