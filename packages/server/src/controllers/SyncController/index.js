import { Controller } from "linebridge/dist/server"
import SecureSyncEntry from "./classes/secureSyncEntry"

import axios from "axios"

export default class SyncController extends Controller {
    static refName = "SyncController"
    static useRoute = "/sync"

    httpEndpoints = {
        post: {
            "/spotify/auth": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const { code, redirect_uri } = req.body

                    if (!code) {
                        return res.status(400).json({
                            message: "Missing code",
                        })
                    }

                    if (!redirect_uri) {
                        return res.status(400).json({
                            message: "Missing redirect_uri",
                        })
                    }

                    const response = await axios({
                        url: "https://accounts.spotify.com/api/token",
                        method: "post",
                        params: {
                            grant_type: "authorization_code",
                            code: code,
                            redirect_uri: redirect_uri
                        },
                        headers: {
                            "Authorization": `Basic ${(Buffer.from(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET).toString("base64"))}`,
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    })

                    if (!response) {
                        return res.status(400).json({
                            message: "Missing data",
                        })
                    }

                    await SecureSyncEntry.set(req.user._id.toString(), "spotify_access_token", response.data.access_token)
                    await SecureSyncEntry.set(req.user._id.toString(), "spotify_refresh_token", response.data.refresh_token)

                    return res.json({
                        message: "ok"
                    })
                }
            },
            "/spotify/unlink": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    await SecureSyncEntry.delete(req.user._id.toString(), "spotify_access_token", "")
                    await SecureSyncEntry.delete(req.user._id.toString(), "spotify_refresh_token", "")

                    return res.json({
                        message: "ok"
                    })
                }
            }
        },

        get: {
            "/spotify/client_id": async (req, res) => {
                return res.json({
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                })
            },
            "/spotify/is_authorized": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const user_id = req.user._id.toString()
                    const authToken = await SecureSyncEntry.get(user_id, "spotify_access_token")

                    if (!authToken) {
                        return res.json({
                            is_authorized: false,
                        })
                    }

                    return res.json({
                        is_authorized: true,
                    })
                }
            },
            "/spotify/data": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const user_id = req.user._id.toString()
                    const authToken = await SecureSyncEntry.get(user_id, "spotify_access_token")

                    if (!authToken) {
                        return res.status(400).json({
                            message: "Missing auth token",
                        })
                    }

                    const response = await axios.get("https://api.spotify.com/v1/me", {
                        headers: {
                            "Authorization": `Bearer ${authToken}`
                        },
                    }).catch((error) => {
                        console.error(error.response.data)

                        res.status(error.response.status).json(error.response.data)

                        return null
                    })

                    if (response) {
                        return res.json(response.data)
                    }
                }
            },
            "/spotify/currently_playing": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const user_id = req.user._id.toString()
                    const authToken = await SecureSyncEntry.get(user_id, "spotify_access_token")

                    if (!authToken) {
                        return res.status(400).json({
                            message: "Missing auth token",
                        })
                    }

                    const response = await axios.get("https://api.spotify.com/v1/me/player", {
                        headers: {
                            "Authorization": `Bearer ${authToken}`
                        },
                    }).catch((error) => {
                        console.error(error.response.data)

                        res.status(error.response.status).json(error.response.data)

                        return null
                    })

                    if (response) {
                        return res.json(response.data)
                    }
                }
            },
            "/spotify/search": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const user_id = req.user._id.toString()
                    const authToken = await SecureSyncEntry.get(user_id, "spotify_access_token")

                    if (!authToken) {
                        return res.status(400).json({
                            message: "Missing auth token",
                        })
                    }

                    const { query, type, limit, offset } = req.query

                    if (!query) {
                        return res.status(400).json({
                            message: "Missing query",
                        })
                    }

                    if (!type) {
                        return res.status(400).json({
                            message: "Missing type",
                        })
                    }

                    const response = await axios.get("https://api.spotify.com/v1/search", {
                        headers: {
                            "Authorization": `Bearer ${authToken}`
                        },
                        params: {
                            q: query,
                            type: type,
                            limit: limit,
                            offset: offset,
                        }
                    }).catch((error) => {
                        console.error(error.response.data)

                        res.status(error.response.status).json(error.response.data)

                        return null
                    })

                    if (response) {
                        return res.json(response.data)
                    }
                }
            }
        },
    }
}