require("dotenv").config()
const ffmpeg = require("@ffmpeg-installer/ffmpeg")

import express from "express"
import path from "path"
import lodash from "lodash"
import { EventEmitter } from "events"

import { Server } from "linebridge/dist/server"
import { SessionsManager, DbManager } from "./managers"
import { getStreamingKeyFromStreamPath } from "./lib"

import MediaServer from "./internal-nms"
import FlvSession from "./internal-nms/sessionsModels/flv_session"

import { StreamingKey } from "./models"

const HTTPServerConfig = {
    port: 3002,
    httpEngine: "express"
}

const MediaServerConfig = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    //logType: 0,
    mediaroot: path.resolve(process.cwd(), "./cache"),
    trans: {
        ffmpeg: ffmpeg.path,
        tasks: [
            {
                app: "live",
                hls: true,
                hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
                dash: true,
                dashFlags: "[f=dash:window_size=3:extra_window_size=5]"
            }
        ]
    },
    fission: {
        ffmpeg: ffmpeg.path,
        tasks: [
            {
                rule: "app/*",
                model: [
                    {
                        ab: "320k",
                        vb: "10500k",
                        vs: "1920x1080",
                        vf: "60",
                    },
                    {
                        ab: "320k",
                        vb: "4500k",
                        vs: "1920x1080",
                        vf: "30",
                    },
                    {
                        ab: "320k",
                        vb: "1500k",
                        vs: "1280x720",
                        vf: "30",
                    },
                    {
                        ab: "96k",
                        vb: "1000k",
                        vs: "854x480",
                        vf: "24",
                    },
                    {
                        ab: "96k",
                        vb: "600k",
                        vs: "640x360",
                        vf: "20",
                    },
                ]
            },
        ]
    }
}

class StreamingServer {
    IHTTPServer = new Server(HTTPServerConfig)

    IMediaServer = new MediaServer(MediaServerConfig)

    Db = new DbManager()

    Sessions = new SessionsManager()

    Stats = {}

    InternalEvents = new EventEmitter()

    constructor() {
        this.registerMediaServerEvents()
        this.registerHTTPServerEndpoints()

        global.resolveUserspaceOfStreamingKey = this.resolveUserspaceOfStreamingKey.bind(this)

        this.IHTTPServer.httpInterface.use("/media", express.static(path.resolve(process.cwd(), "./cache/live")))

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
        "/status": {
            method: "get",
            fn: async (req, res) => {
                const serverStatus = await this.IMediaServer.getServerStatus()

                return res.json(serverStatus)
            }
        },
        "/streams": {
            method: "get",
            fn: async (req, res) => {
                let streams = []

                if (req.query?.username) {
                    streams = await this.Sessions.getStreamsByUsername(req.query?.username)
                } else {
                    streams = this.Sessions.getPublicStreams()
                }

                // retrieve streams details from internal media server api
                let streamsListDetails = this.IMediaServer.getSessions()//await axios.get(`${internalMediaServerURI}/api/streams`)

                streamsListDetails = streamsListDetails?.live ?? {}

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

                // if username is provided, return only streams for that user
                // is supposed to be allowed only one stream per user
                if (req.query?.username) {
                    return res.json(streams[0])
                }

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
                        // fix streamKey
                        req.url = `/live/${streamKey}.flv`

                        req.nmsConnectionType = "http"

                        let session = new FlvSession(req, res)

                        session.run()

                        break;
                    }

                    case "hls": {
                        return res.status(501).send("Not implemented")
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

    resolveUserspaceOfStreamingKey = async (streamingKey) => {
        const streamingUserspace = await StreamingKey.findOne({
            key: streamingKey
        })

        if (!streamingUserspace) {
            return false
        }

        return streamingUserspace
    }

    initialize = async () => {
        await this.Db.connect()

        await this.IHTTPServer.initialize()
        await this.IMediaServer.run()
    }
}

new StreamingServer()