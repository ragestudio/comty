import { Controller } from "linebridge/dist/server"
import { nanoid } from "nanoid"
import lodash from "lodash"
import axios from "axios"

import { Schematized } from "../../lib"
import { User, StreamingKey, StreamingInfo, StreamingCategory } from "../../models"

const streamingIngestServer = process.env.STREAMING_INGEST_SERVER ?? ""
const streamingServerAPIAddress = process.env.STREAMING_API_SERVER ?? ""

const streamingServerAPIUri = `${streamingServerAPIAddress.startsWith("https") ? "https" : "http"}://${streamingServerAPIAddress.split("://")[1]}`

const FILTER_KEYS = ["stream"]

export default class StreamingController extends Controller {
    static useRoute = "/tv"

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
        fetchStreams: async () => {
            // fetch all streams from api
            let { data } = await axios.get(`${streamingServerAPIUri}/api/v1/streams`).catch((err) => {
                console.error(err)
                return false
            })

            let streamings = []

            if (!data) return streamings

            streamings = data.streams

            streamings = streamings.map(async (stream) => {
                stream = await this.methods.generateStreamFromStreamkey(stream.name)

                let info = await StreamingInfo.findOne({
                    user_id: stream.user_id
                })

                if (info) {
                    stream.info = info.toObject()

                    stream.info.category = await StreamingCategory.findOne({
                        key: stream.info.category
                    })
                }

                return stream
            })

            streamings = await Promise.all(streamings)

            return streamings.map((stream) => {
                return lodash.omit(stream, FILTER_KEYS)
            })
        },
        generateStreamFromStreamkey: async (streamKey) => {
            // generate a stream from a streamkey
            const streamingKey = await StreamingKey.findOne({
                key: streamKey
            })

            if (!streamingKey) return false

            const streaming = {
                user_id: streamingKey.user_id,
                username: streamingKey.username,
                sources: {
                    rtmp: `${streamingIngestServer}/live/${streamingKey.username}`,
                    hls: `${streamingServerAPIAddress}/live/${streamingKey.username}/src.m3u8`,
                    flv: `${streamingServerAPIAddress}/live/${streamingKey.username}/src.flv`,
                }
            }

            return streaming
        },
        handleInfoUpdate: async (payload) => {
            let info = await StreamingInfo.findOne({
                user_id: payload.user_id
            }).catch((err) => {
                return false
            })

            const payloadValues = {
                title: payload.title,
                description: payload.description,
                category: payload.category,
                thumbnail: payload.thumbnail,
            }

            if (!info) {
                // create new info
                info = new StreamingInfo({
                    user_id: payload.user_id,
                    ...payloadValues
                })
            }

            // merge data
            info = lodash.merge(info, {
                title: payload.title,
                description: payload.description,
                category: payload.category,
                thumbnail: payload.thumbnail,
            })

            await info.save()

            global.wsInterface.io.emit(`streaming.info_update.${payload.user_id}`, info)

            return info
        }
    }

    get = {
        "/streaming/categories": async (req, res) => {
            const categories = await StreamingCategory.find()

            return res.json(categories)
        },
        "/streams": async (req, res) => {
            const remoteStreams = await this.methods.fetchStreams()

            return res.json(remoteStreams)
        },
        "/stream/info": {
            middleware: ["withAuthentication"],
            fn: async (req, res) => {
                let user_id = req.query.user_id

                if (!req.query.username && !req.query.user_id) {
                    return res.status(400).json({
                        error: "Invalid request, missing username"
                    })
                }

                if (!user_id) {
                    user_id = await User.findOne({
                        username: req.query.username,
                    })

                    user_id = user_id["_id"].toString()
                }

                let info = await StreamingInfo.findOne({
                    user_id,
                })

                if (!info) {
                    info = new StreamingInfo({
                        user_id,
                    })

                    await info.save()
                }

                const category = await StreamingCategory.findOne({
                    key: info.category
                }).catch((err) => {
                    console.error(err)
                    return {}
                }) ?? {}

                return res.json({
                    ...info.toObject(),
                    ["category"]: {
                        key: category?.key ?? "unknown",
                        label: category?.label ?? "Unknown",
                    }
                })
            }
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

            const streamings = await this.methods.fetchStreams()

            // search on this.streamings
            const streaming = streamings.find((streaming) => streaming.username === username)

            if (streaming) {
                return res.json(lodash.omit(streaming, FILTER_KEYS))
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

    put = {
        "/streaming/category": {
            middlewares: ["withAuthentication", "onlyAdmin"],
            fn: Schematized({
                required: ["key", "label"]
            }, async (req, res) => {
                const { key, label } = req.selection

                const existingCategory = await StreamingCategory.findOne({
                    key
                })

                if (existingCategory) {
                    return res.status(400).json({
                        error: "Category already exists"
                    })
                }

                const category = new StreamingCategory({
                    key,
                    label,
                })

                await category.save()

                return res.json(category)
            })
        }
    }

    post = {
        "/streaming/update_info": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                const { title, description, category, thumbnail } = req.body

                const info = await this.methods.handleInfoUpdate({
                    user_id: req.user._id.toString(),
                    title,
                    description,
                    category,
                    thumbnail
                }).catch((err) => {
                    console.error(err)

                    res.status(500).json({
                        error: `Cannot update info: ${err.message}`,
                    })

                    return null
                })

                if (info) {
                    return res.json(info)
                }
            }
        },
        "/streaming/publish": async (req, res) => {
            const { stream } = req.body

            const streaming = await this.methods.generateStreamFromStreamkey(stream).catch((err) => {
                console.error(err)

                res.status(500).json({
                    error: `Cannot generate stream: ${err.message}`,
                })

                return null
            })

            if (streaming) {
                global.wsInterface.io.emit(`streaming.new`, streaming)

                global.wsInterface.io.emit(`streaming.new.${streaming.username}`, streaming)

                return res.json({
                    code: 0,
                    status: "ok"
                })
            }
        },
        "/streaming/unpublish": async (req, res) => {
            const { stream } = req.body

            const streaming = await this.methods.generateStreamFromStreamkey(stream).catch((err) => {
                console.error(err)

                return null
            })

            if (streaming) {
                global.wsInterface.io.emit(`streaming.end`, streaming)

                global.wsInterface.io.emit(`streaming.end.${streaming.username}`, streaming)

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