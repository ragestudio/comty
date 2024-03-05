import axios from "axios"

import { StreamingCategory, StreamingProfile, User } from "@shared-classes/DbModels"

import composeStreamingSources from "@utils/compose-streaming-sources"
import lodash from "lodash"

const streamingServerAPIAddress = process.env.STREAMING_API_SERVER ?? ""
const streamingServerAPIUri = `${streamingServerAPIAddress.startsWith("https") ? "https" : "http"}://${streamingServerAPIAddress.split("://")[1]}`

export default async (stream_id) => {
    let apiURI = `${streamingServerAPIUri}/streams`

    // fetch all streams from api
    let { data } = await axios({
        method: "GET",
        url: apiURI,
        params: {
            stream: stream_id,
        }
    }).catch((err) => {
        console.error(err)
        return false
    })

    let streamings = []

    if (!data) return streamings

    if (stream_id) {
        streamings.push(data)
    } else {
        streamings = data
    }

    streamings = streamings.map(async (entry) => {
        const { stream, profile_id } = entry

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

        const sources = composeStreamingSources(user.username, profile._id)

        return {
            profile_id: profile._id,
            info: profile.info,
            name: stream,
            streamUrl: `${user.username}?profile=${profile._id}`,
            sources: lodash.pick(sources, ["rtmp", "hls", "flv", "aac"]),
            user,
        }
    })

    streamings = await Promise.all(streamings)

    streamings = streamings.filter((stream) => stream !== null)

    if (stream_id) {
        return streamings[0]
    }

    return streamings
}