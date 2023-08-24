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
        country,
    }) {
        let params = {
            countryCode: country ?? "US",
            audioquality: quality ?? "LOSSLESS",
            playbackmode: "STREAM",
            assetpresentation: "FULL",
        }

        let response = await axios({
            method: "GET",
            url: `https://api.tidal.com/v1/tracks/${track_id}/playbackinfopostpaywall`,
            params: params,
            headers: {
                Origin: "http://listen.tidal.com",
                Authorization: `Bearer ${access_token}`
            }
        })

        let decodedManifest = JSON.parse(global.b64Decode(response.data.manifest))

        decodedManifest.url = decodedManifest.urls[0]

        return {
            metadata: {
                trackId: track_id,
                audioMode: response.data.audioMode,
                audioQuality: response.data.audioQuality,
                bitDepth: response.data.bitDepth,
                bitRate: response.data.bitRate,
                mimeType: response.data.manifestMimeType
            },
            ...decodedManifest
        }
    }
    static async getTrackMetadata({
        track_id,
        access_token,
        country,
    }) {
        const response = await axios({
            method: "GET",
            url: `https://api.tidal.com/v1/tracks/${track_id}`,
            params: {
                "countryCode": country
            },
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

        return response.data.tracks.items.map((item) => {
            item._id = item.id

            const coverUID = item.album.cover.replace(/-/g, "/")

            item.cover = `https://resources.tidal.com/images/${coverUID}/1280x1280.jpg`

            item.artist = item.artists.map(artist => artist.name).join(", ")

            item.metadata = {
                title: item.title,
                artists: item.artists.map(artist => artist.name).join(", "),
                artist: item.artists.map(artist => artist.name).join(", "),
                album: item.album.title,
                duration: item.duration
            }

            item.service = "tidal"

            return item
        })
    }
    static async getFavoriteTracks({
        user_id,
        country,
        access_token,
        limit = 100,
        offset = 0,
    }) {
        const url = `https://api.tidal.com/v1/users/${user_id}/favorites/tracks?countryCode=${country}`

        const response = await axios({
            method: "GET",
            url,
            headers: {
                "Origin": "http://listen.tidal.com",
                Authorization: `Bearer ${access_token}`
            },
            params: {
                order: "DATE",
                orderDirection: "DESC",
                limit: limit,
                offset: offset,
            }
        })

        response.data.items = response.data.items.map((item) => {
            // get js time
            item.item.liked_at = new Date(item.created).getTime()
            item.item.service = "tidal"

            item.item._id = item.item.id

            const coverUID = item.item.album.cover.replace(/-/g, "/")

            item.item.cover = `https://resources.tidal.com/images/${coverUID}/1280x1280.jpg`

            item.item.artist = item.item.artists.map(artist => artist.name).join(", ")

            item.item.metadata = {
                title: item.item.title,
                artists: item.item.artists.map(artist => artist.name).join(", "),
                artist: item.item.artists.map(artist => artist.name).join(", "),
                album: item.item.album.title,
                duration: item.item.duration
            }

            item.item.liked = true
            item.item._computed = true

            return item.item
        })

        return {
            total_length: response.data.totalNumberOfItems,
            tracks: response.data.items
        }
    }
}