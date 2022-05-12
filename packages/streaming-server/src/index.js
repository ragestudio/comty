const ffmpeg = require("@ffmpeg-installer/ffmpeg")
import lodash from "lodash"

import { Server } from "linebridge/dist/server"
import MediaServer from "node-media-server"
import { SessionsManager, DbManager } from "./managers"
import { getStreamingKeyFromStreamPath } from "./lib"

import axios from "axios"
import stream from "stream"

import { StreamingKey } from "./models"

const HTTPServerConfig = {
    port: 3002,
}

const MediaServerConfig = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 1000,
        allow_origin: '*'
    },
    trans: {
        ffmpeg: ffmpeg.path,
        tasks: [
            {
                app: "live",
                hls: true,
                hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
            }
        ]
    }
}

const internalMediaServerURI = `http://127.0.0.1:${MediaServerConfig.http.port}`

class StreamingServer {
    IHTTPServer = new Server(HTTPServerConfig)

    IMediaServer = new MediaServer(MediaServerConfig)

    Db = new DbManager()

    Sessions = new SessionsManager()

    constructor() {
        this.registerMediaServerEvents()
        this.registerHTTPServerEndpoints()

        // fire initization
        this.initialize()
    }

    registerMediaServerEvents = () => {
        Object.keys(this.mediaServerEvents).forEach((eventName) => {
            this.IMediaServer.on(eventName, this.mediaServerEvents[eventName])
        })
    }

    registerHTTPServerEndpoints = () => {
        Object.keys(this.httpServerEndpoints).forEach((route) => {
            this.IHTTPServer.registerHTTPEndpoint({
                route: route,
                ...this.httpServerEndpoints[route]
            })
        })
    }

    httpServerEndpoints = {
        "/events/on-publish": {
            method: "post",
            fn: async (req, res) => {
                req.body = Buffer.from(req.body).toString()

                // decode url-encoded body
                req.body = req.body.split("&").reduce((acc, cur) => {
                    const [key, value] = cur.split("=")
                    acc[key] = value

                    return acc
                }, {})

                const streamingKey = req.body.name

                const streamingUserspace = await StreamingKey.findOne({
                    key: streamingKey
                })

                if (!streamingUserspace) {
                    return res.status(403).send("Invalid stream key")
                }

                this.Sessions.publishStream({
                    user_id: streamingUserspace.user_id,
                    stream_key: streamingKey
                })

                return res.send("OK")
            }
        },
        "/events/on-publish-done": {
            method: "post",
            fn: async (req, res) => {
                req.body = Buffer.from(req.body).toString()

                // decode url-encoded body
                req.body = req.body.split("&").reduce((acc, cur) => {
                    const [key, value] = cur.split("=")
                    acc[key] = value

                    return acc
                }, {})

                const streamingKey = req.body.name

                const streamingUserspace = await StreamingKey.findOne({
                    key: streamingKey
                })

                if (!streamingUserspace) {
                    return res.status(403).send("Invalid stream key")
                }

                this.Sessions.unpublishStream(streamingKey)

                return res.send("OK")
            }
        },
        "/streams": {
            method: "get",
            fn: async (req, res) => {
                if (req.query?.user_id) {
                    const streams = await this.Sessions.getStreamsByUserId(req.query.user_id)

                    return res.json(streams)
                }

                let streams = this.Sessions.getPublicStreams()

                // retrieve streams details from internal media server api
                let streamsListDetails = await axios.get(`${internalMediaServerURI}/api/streams`)

                streamsListDetails = streamsListDetails.data.live ?? {}

                // return only publisher details
                streamsListDetails = Object.keys(streamsListDetails).map((streamKey) => {
                    return {
                        // filter unwanted properties
                        ...lodash.omit(streamsListDetails[streamKey].publisher, ["stream", "ip"])
                    }
                })

                // reduce as an object
                streamsListDetails = streamsListDetails.reduce((acc, cur) => {
                    acc[cur.clientId] = cur

                    return acc
                }, {})

                // merge with public streams
                streams = streams.map((stream) => {
                    return {
                        ...stream,
                        ...streamsListDetails[stream.id]
                    }
                })

                return res.json(streams)
            }
        },
        "/stream/:mode/:username": {
            method: "get",
            fn: async (req, res) => {
                const { username, mode = "flv" } = req.params

                const streamSession = this.Sessions.publicStreams.find(stream => {
                    if (stream.username === username) {
                        return stream
                    }
                })

                if (!streamSession) {
                    return res.status(404).json({
                        error: "Stream not found"
                    })
                }

                const streamKey = streamSession.stream_key

                switch (mode) {
                    case "flv": {
                        const streamingFLVUri = `${internalMediaServerURI}/live/${streamKey}.flv`

                        // create a stream pipe response using media server api with axios
                        const request = await axios.get(streamingFLVUri, {
                            responseType: "stream"
                        })

                        // create a buffer stream from the request
                        const bufferStream = request.data.pipe(new stream.PassThrough())

                        // set header for stream response
                        res.setHeader("Content-Type", "video/x-flv")

                        // pipe the buffer stream to the response
                        bufferStream.on("data", (chunk) => {
                            res.write(chunk)
                        })

                        break;
                    }

                    case "hls": {
                        const streamingHLSUri = `${internalMediaServerURI}/live/${streamKey}.m3u8`

                        // create a stream pipe response using media server api with axios
                        const request = await axios.get(streamingHLSUri, {
                            responseType: "stream"
                        })

                        // create a buffer stream from the request
                        const bufferStream = request.data.pipe(new stream.PassThrough())

                        // set header for stream response
                        res.setHeader("Content-Type", "application/x-mpegURL")

                        // pipe the buffer stream to the response
                        bufferStream.on("data", (chunk) => {
                            res.write(chunk)
                        })

                        break;
                    }

                    default: {
                        return res.status(400).json({
                            error: "Stream mode not supported"
                        })
                    }
                }
            }
        }
    }

    mediaServerEvents = {
        prePublish: async (id, StreamPath, args) => {
            // this event is fired before client is published
            // here must be some validation (as key validation)

            // get session
            const session = this.IMediaServer.getSession(id)

            // create a userspaced session for the client with containing session
            this.Sessions.newSession(id, session)

            const streamingKey = getStreamingKeyFromStreamPath(StreamPath)

            const streamingUserspace = await StreamingKey.findOne({
                key: streamingKey
            })

            if (!streamingUserspace) {
                this.Sessions.removeSession(id)
                return false
            }

            this.Sessions.publishStream({
                id,
                user_id: streamingUserspace.user_id,
                username: streamingUserspace.username,
                stream_key: streamingKey
            })
        },
        donePublish: async (id, StreamPath, args) => {
            // this event is fired when client has ended the connection

            // stop the session
            this.Sessions.removeSession(id)

            const streamingKey = getStreamingKeyFromStreamPath(StreamPath)

            this.Sessions.unpublishStream(streamingKey)
        }
    }

    initialize = async () => {
        await this.Db.connect()

        await this.IHTTPServer.initialize()
        await this.IMediaServer.run()
    }
}

new StreamingServer()