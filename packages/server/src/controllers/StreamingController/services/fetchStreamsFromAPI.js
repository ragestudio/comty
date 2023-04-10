import axios from "axios"

import { StreamingCategory, StreamingProfile, User } from "@models"

const streamingServerAPIAddress = process.env.STREAMING_API_SERVER ?? ""

const streamingServerAPIUri = `${streamingServerAPIAddress.startsWith("https") ? "https" : "http"}://${streamingServerAPIAddress.split("://")[1]}`

export default async (stream_id) => {
    let apiURI = `${streamingServerAPIUri}/api/v1/streams`

    if (stream_id) {
        apiURI = `${streamingServerAPIUri}/api/v1/streams/${stream_id}`
    }

    // fetch all streams from api
    let { data } = await axios.get(apiURI).catch((err) => {
        console.error(err)
        return false
    })

    let streamings = []

    if (!data) return streamings

    if (data.stream && stream_id) {
        streamings.push(data.stream)
    }

    if (data.streams) {
        streamings = data.streams
    }

    streamings = streamings.map(async (stream) => {
        const { video, audio, clients, app } = stream

        const profile_id = app.split(":")[1]

        let profile = await StreamingProfile.findById(profile_id)

        if (!profile) return null

        profile = profile.toObject()

        profile._id = profile._id.toString()

        profile.info.category = await StreamingCategory.findOne({
            key: profile.info.category
        })

        let user = await User.findById(profile.user_id)

        if (!user) return null

        user = user.toObject()

        return {
            profile_id: profile._id,
            info: profile.info,
            stream: `${user.username}?profile=${profile._id}`,
            user,
            video,
            audio,
            connectedClients: clients ?? 0,
            sources: {
                hls: `${streamingServerAPIUri}/live/${user.username}:${profile._id}/src.m3u8`,
                flv: `${streamingServerAPIUri}/live/${user.username}:${profile._id}/src.flv`,
                dash: `${streamingServerAPIUri}/live/${user.username}:${profile._id}/src.mpd`,
                aac: `${streamingServerAPIUri}/radio/${user.username}:${profile._id}/src.aac`,
            }
        }
    })

    streamings = await Promise.all(streamings)

    streamings = streamings.filter((stream) => stream !== null)

    if (stream_id) {
        return streamings[0]
    }

    return streamings
}