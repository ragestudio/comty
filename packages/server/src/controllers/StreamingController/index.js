import { Controller } from "linebridge/dist/server"
import { User, StreamingKey } from "../../models"
import { nanoid } from "nanoid"
import lodash from "lodash"
import axios from "axios"

const streamingIngestServer = process.env.STREAMING_INGEST_SERVER
const streamingServerAPIAddress = process.env.STREAMING_API_SERVER
const streamingServerAPIProtocol = streamingServerAPIAddress.startsWith("https") ? "https" : "http"

const streamingServerAPIUri = `${streamingServerAPIProtocol}://${streamingServerAPIAddress}`

const FILTER_KEYS = ["stream"]

export default class StreamingController extends Controller {
    streamings = []

    methods = {
        genereteKey: async (user_id) => {
            // this will generate a new key for the user
            // if the user already has a key, it will be regenerated

            // get username from user_id
            const userData = await User.findById(user_id)

            const streamingKey = new StreamingKey({
                user_id,
                username: userData.username,
                key: nanoid()
            })

            await streamingKey.save()

            return streamingKey
        },
        regenerateStreamingList: async () => {
            // fetch all streams from api
            let streams = await axios.get(`${streamingServerAPIUri}/api/v1/streams`).catch((err) => {
                console.log(err)
                return false
            })

            if (streams) {
                streams = streams.data.streams

                // FIXME: this method is not totally async
                streams.forEach((stream) => {
                    // check if the stream is already in the list
                    const streamInList = this.streamings.find((s) => s.stream === stream.name)

                    if (!streamInList) {
                        // if not, add it
                        this.methods.pushToLocalList({
                            stream: stream.name,
                            app: stream.app,
                        }).catch((err) => {
                            // sorry for you
                        })
                    }
                })
            }
        },
        pushToLocalList: async (payload) => {
            const { stream, app } = payload

            const username = app.split("/")[1]

            const streamingKey = await StreamingKey.findOne({
                key: stream
            })

            if (!streamingKey) {
                throw new Error("Invalid streaming key")
            }

            if (username !== streamingKey.username) {
                throw new Error("Invalid streaming key for this username")
            }

            const streaming = {
                stream,
                username: streamingKey.username,
                sources: {
                    rtmp: `${streamingIngestServer}/live/${username}`,
                    hls: `${streamingServerAPIAddress}/live/${username}/src.m3u8`,
                    flv: `${streamingServerAPIAddress}/live/${username}/src.flv`,
                }
            }

            this.streamings.push(streaming)

            return streaming
        },
        removeFromLocalList: async (payload) => {
            const { stream } = payload

            // remove from streamings array
            const streaming = this.streamings.find((streaming) => streaming.stream === stream)

            if (!streaming) {
                throw new Error("Stream not found")
            }

            this.streamings = this.streamings.filter((streaming) => streaming.stream !== stream)

            return streaming
        }
    }

    get = {
        "/streams": async (req, res) => {
            await this.methods.regenerateStreamingList()

            const data = this.streamings.map((stream) => {
                return lodash.omit(stream, FILTER_KEYS)
            })

            return res.json(data)
        },
        "/streaming/addresses": {
            middlewares: ["withOptionalAuthentication"],
            fn: async (req, res) => {
                const addresses = {
                    api: streamingServerAPIAddress,
                    ingest: streamingIngestServer,
                }

                if (req.user) {
                    addresses.liveURL = `${addresses.api}/live/${req.user.username}`
                    addresses.ingestURL = `${addresses.ingest}/${req.user.username}`

                    addresses.hlsURL = `${addresses.liveURL}/src.m3u8`
                    addresses.flvURL = `${addresses.liveURL}/src.flv`
                }

                return res.json(addresses)
            }
        },
        "/streaming/:username": async (req, res) => {
            const { username } = req.params

            // search on this.streamings
            const streaming = this.streamings.find((streaming) => streaming.username === username)

            if (streaming) {
                return res.json(streaming)
            }

            return res.status(404).json({
                error: "Stream not found"
            })
        },
        "/streaming_key": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                let streamingKey = await StreamingKey.findOne({
                    user_id: req.user._id.toString()
                })

                if (!streamingKey) {
                    const newKey = await this.methods.genereteKey(req.user._id.toString()).catch(err => {
                        res.status(500).json({
                            error: `Cannot generate a new key: ${err.message}`,
                        })

                        return false
                    })

                    if (!newKey) {
                        return false
                    }

                    return res.json(newKey)
                } else {
                    return res.json(streamingKey)
                }
            }
        },
    }

    post = {
        "/streaming/publish": async (req, res) => {
            const { app, stream, tcUrl } = req.body

            const streaming = await this.methods.pushToLocalList({
                app,
                stream,
                tcUrl
            }).catch((err) => {
                res.status(500).json({
                    code: 1,
                    error: err.message
                })

                return false
            })

            if (streaming) {
                global.wsInterface.io.emit(`streaming.new`, {
                    username: streaming.username,
                })

                return res.json({
                    code: 0,
                    status: "ok"
                })
            }
        },
        "/streaming/unpublish": async (req, res) => {
            const { stream } = req.body

            const streaming = this.methods.removeFromLocalList({
                stream
            }).catch((err) => {
                res.status(500).json({
                    code: 2,
                    status: err.message
                })

                return false
            })

            if (streaming) {
                global.wsInterface.io.emit(`streaming.end`, {
                    username: streaming.username,
                })

                return res.json({
                    code: 0,
                    status: "ok"
                })
            }
        },
        "/regenerate_streaming_key": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                // check if the user already has a key
                let streamingKey = await StreamingKey.findOne({
                    user_id: req.user._id.toString()
                })

                // if exists, delete it

                if (streamingKey) {
                    await streamingKey.remove()
                }

                // generate a new key
                const newKey = await this.methods.genereteKey(req.user._id.toString()).catch(err => {
                    res.status(500).json({
                        error: `Cannot generate a new key: ${err.message}`,
                    })

                    return false
                })

                if (!newKey) {
                    return false
                }

                return res.json(newKey)
            }
        }
    }
}