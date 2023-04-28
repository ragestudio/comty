const streamingServerAPIAddress = process.env.STREAMING_API_SERVER ?? ""

const streamingServerAPIUri = `${streamingServerAPIAddress.startsWith("https") ? "https" : "http"}://${streamingServerAPIAddress.split("://")[1]}`

export default (username, profile_id) => {
    const streamId = `${username}${profile_id ? `:${profile_id}` : ""}`

    return {
        ingest: process.env.STREAMING_INGEST_SERVER,
        rtmp: `${streamingServerAPIUri}/${streamId}`,
        hls: `${streamingServerAPIUri}/stream/${streamId}/src.m3u8`,
        flv: `${streamingServerAPIUri}/stream/${streamId}/src.flv`,
        aac: `${streamingServerAPIUri}/stream/${streamId}/src.aac`,
    }
}