import axios from "axios"

const TIDAL_CLIENT_ID = process.env.TIDAL_CLIENT_ID
const TIDAL_CLIENT_SECRET = process.env.TIDAL_CLIENT_SECRET

export default class TidalAPI {
    static async checkAuthStatus(device_code) {
        const data = {
            "client_id": TIDAL_CLIENT_ID,
            "device_code": device_code,
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            "scope": "r_usr+w_usr+w_sub"
        }

        const response = await axios({
            method: "POST",
            url: "https://auth.tidal.com/v1/oauth2/token",
            params: data,
            auth: {
                username: TIDAL_CLIENT_ID,
                password: TIDAL_CLIENT_SECRET
            }
        }).catch((err) => {
            return false
        })

        if (!response) {
            return false
        }

        return response.data
    }

    static async getAuthUrl() {
        let data = {
            client_id: TIDAL_CLIENT_ID,
            scope: "r_usr+w_usr+w_sub"
        }

        const response = await axios({
            method: "POST",
            url: "https://auth.tidal.com/v1/oauth2/device_authorization",
            params: data
        })

        return {
            url: "https://" + response.data.verificationUri + "/" + response.data.userCode,
            device_code: response.data.deviceCode,
            expires_in: response.data.expiresIn
        }
    }

    static async getUserData({
        access_token,
        user_id,
        country
    }) {
        const url = `https://api.tidal.com/v1/users/${user_id}?countryCode=${country}`

        const response = await axios({
            method: "GET",
            url,
            headers: {
                "Origin": "http://listen.tidal.com",
                Authorization: `Bearer ${access_token}`
            }
        })

        return response.data
    }

    static async getTrackPlaybackUrl({
        track_id,
        quality,
        access_token,
    }) {
        let data = {
            soundQuality: quality ?? "LOSSLESS",
        }

        const response = await axios({
            method: "GET",
            url: `https://api.tidal.com/v1/tracks/${track_id}/streamUrl`,
            params: data,
            headers: {
                "Origin": "http://listen.tidal.com",
                Authorization: `Bearer ${access_token}`
            }
        })

        return response.data
    }
    static async getTrackMetadata({
        track_id,
        access_token,
        country,
    }) {
        const response = await axios({
            method: "GET",
            url: `https://api.tidal.com/v1/tracks/${track_id}/?countryCode=${country}`,
            headers: {
                "Origin": "http://listen.tidal.com",
                Authorization: `Bearer ${access_token}`
            }
        })

        return response.data
    }

    static async getTrackManifest({
        track_id,
        quality,
        access_token,
        country,
    }) {
        const playback = await TidalAPI.getTrackPlaybackUrl({
            track_id,
            quality,
            access_token,
            country,
        })

        const metadata = await TidalAPI.getTrackMetadata({
            track_id,
            access_token,
            country,
        })

        return {
            playback,
            metadata
        }
    }

    static async search({
        query,
        type = "all"
    }) {
        let url = `https://api.tidal.com/v1/search`

        switch (type) {
            case "all":
                url = `https://api.tidal.com/v1/search`
                break
            case "playlists":
                url = `https://api.tidal.com/v1/search/playlists`
                break
            case "artists":
                url = `https://api.tidal.com/v1/search/artists`
                break
            case "albums":
                url = `https://api.tidal.com/v1/search/albums`
                break
            case "tracks":
                url = `https://api.tidal.com/v1/search/tracks`
                break
        }

        const response = await axios({
            method: "GET",
            url: url,
            params: {
                query: query,
                countryCode: "AZ"
            },
            headers: {
                "Origin": "http://listen.tidal.com",
                "x-tidal-token": TIDAL_CLIENT_ID
            }
        })

        return response.data
    }
}