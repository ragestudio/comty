import axios from "axios"
import lodash from "lodash"

import { StreamingCategory } from "@models"
import generateStreamDataFromStreamingKey from "./generateStreamDataFromStreamingKey"

const streamingServerAPIAddress = process.env.STREAMING_API_SERVER ?? ""

const streamingServerAPIUri = `${streamingServerAPIAddress.startsWith("https") ? "https" : "http"}://${streamingServerAPIAddress.split("://")[1]}`

const FILTER_KEYS = ["stream"]

export default async () => {
    // fetch all streams from api
    let { data } = await axios.get(`${streamingServerAPIUri}/api/v1/streams`).catch((err) => {
        console.error(err)
        return false
    })

    let streamings = []

    if (!data) return streamings

    streamings = data.streams

    streamings = streamings.map(async (stream) => {
        const { video, audio, clients } = stream

        stream = await generateStreamDataFromStreamingKey(stream.name)

        let info = await StreamingInfo.findOne({
            user_id: stream.user_id
        })

        if (info) {
            stream.info = info.toObject()

            stream.info.category = await StreamingCategory.findOne({
                key: stream.info.category
            })
        }

        stream.video = video
        stream.audio = audio
        stream.connectedClients = clients ?? 0

        return stream
    })

    streamings = await Promise.all(streamings)

    return streamings.map((stream) => {
        return lodash.omit(stream, FILTER_KEYS)
    })
}