import { StreamingKey } from "@models"

const streamingServerAPIUri = process.env.STREAMING_API_SERVER ? `${process.env.STREAMING_API_SERVER.startsWith("https") ? "https" : "http"}://${process.env.STREAMING_API_SERVER.split("://")[1]}` : "Not available"

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
            rtmp: `${process.env.STREAMING_INGEST_SERVER}/live/${streamingKey.username}`,
            hls: `${streamingServerAPIUri}/live/${streamingKey.username}/src.m3u8`,
            flv: `${streamingServerAPIUri}/live/${streamingKey.username}/src.flv`,
            aac: `${streamingServerAPIUri}/radio/${streamingKey.username}/src.aac`,
        }
    }

    return streaming
}