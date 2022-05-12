const ffmpeg = require("@ffmpeg-installer/ffmpeg")

import { Server } from "linebridge/dist/server"
import MediaServer from "node-media-server"
import { SessionsManager, DbManager } from "./managers"
import { getStreamingKeyFromStreamPath } from "./lib"

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
    // trans: {
    //     ffmpeg: ffmpeg.path,
    //     tasks: [
    //         {
    //             app: "live",
    //             hls: true,
    //             hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
    //             dash: true,
    //             dashFlags: "[f=dash:window_size=3:extra_window_size=5]"
    //         }
    //     ]
    // }
}

class StreamingServer {
    IHTTPServer = new Server(HTTPServerConfig)

    IMediaServer = new MediaServer(MediaServerConfig)
    
    Db = new DbManager()
    
    Sessions = new SessionsManager()

    PublicStreamings = []

    constructor() {
        this.registerMediaServerEvents()

        // fire initization
        this.initialize()
    }

    registerMediaServerEvents = () => {
        Object.keys(this.mediaServerEvents).forEach(eventName => {
            this.IMediaServer.on(eventName, this.mediaServerEvents[eventName])
        })
    }

    mediaServerEvents = {
        preConnect: async (id, args) => {
            // this event is fired after client is connected
            // but session is not created yet & not ready to publish

            // get session
            const session = this.IMediaServer.getSession(id)
            
            // create a userspaced session for the client with containing session
            this.Sessions.newSession(id, session)
        },
        postConnect: async (id, args) => {
            // this event is fired after client is connected and session is created
            // and is already published
        },
        doneConnect: async (id, args) => {
            // this event is fired when client has ended the connection
            
            // stop the session
            this.Sessions.removeSession(id)
        },
        prePublish: async (id, StreamPath, args) => {
            // this event is fired before client is published
            // here must be some validation (as key validation)
            const streamingKey = getStreamingKeyFromStreamPath(StreamPath)

            const streamingUserspace = await StreamingKey.findOne({
                key: streamingKey
            })

            console.log(streamingUserspace)

            if (!streamingUserspace) {
                this.Sessions.removeSession(id)
                return false
            }

            PublicStreamings.push(id)
        }
    }

    initialize = async () => {
        await this.Db.connect()
        this.IMediaServer.run()
    }
}

new StreamingServer()