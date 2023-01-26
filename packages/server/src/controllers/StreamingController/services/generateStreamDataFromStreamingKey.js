import { StreamingKey } from "@models"

export default async (key) => {
    // generate a stream from a streamkey
    const streamingKey = await StreamingKey.findOne({
        key: key
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
}