import { Controller } from "linebridge/dist/server"
import { User, StreamingKey } from "../../models"
import { nanoid } from "nanoid"

import axios from "axios"

const streamingServerAddress = process.env.mediaServerAddress ?? "media.ragestudio.net"
const streamingServerAPIPort = process.env.mediaServerAPIPort ?? 3002
const streamingServerAPIProtocol = process.env.mediaServerAPIProtocol ?? "http"
const streamingServerAPIUri = `${streamingServerAPIProtocol}://${streamingServerAddress}:${streamingServerAPIPort}`

export default class StreamingController extends Controller {
    static useMiddlewares = ["withAuthentication"]

    methods = {
        genereteKey: async (user_id) => {
            // this will generate a new key for the user
            // if the user already has a key, it will be regenerated

            const streamingKey = new StreamingKey({
                user_id,
                key: nanoid()
            })

            await streamingKey.save()

            return streamingKey
        }
    }

    get = {
        "/streams": async (req, res) => {
            // TODO: meanwhile linebridge remote linkers are in development we gonna use this methods to fetch
            const { data } = await axios.get(`${streamingServerAPIUri}/streams`).catch((error) => {
                res.status(500).json({
                    error: `Failed to fetch streams from [${streamingServerAddress}]: ${error.message}`
                })
                return false
            })

            if (data) {
                return res.json(data)
            }
        },
        "/target_streaming_server": async (req, res) => {
            // TODO: resolve an available server
            // for now we just return the only one should be online
            return res.json({
                protocol: "rtmp",
                port: "1935",
                space: "live",
                address: streamingServerAddress,
            })
        },
        "/streaming_key": async (req, res) => {
            let streamingKey = await StreamingKey.findOne({
                userId: req.user._id.toString()
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
        },
    }
}