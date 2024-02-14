const streamingServerAPIAddress = process.env.STREAMING_API_SERVER ?? ""

const streamingServerAPIUri = `${streamingServerAPIAddress.startsWith("https") ? "https" : "http"}://${streamingServerAPIAddress.split("://")[1]}`

export default (username, profile_id) => {
    const streamId = `${username}${profile_id ? `__${profile_id}` : ""}`

    return {
        ingest: process.env.STREAMING_INGEST_SERVER,
        rtmp: `${streamingServerAPIUri}/${streamId}`,
        rtsp: `rtsp://${process.env.STREAMING_INGEST_SERVER}:8554/live/${streamId}`,
        hls: `${streamingServerAPIUri}/stream/hls/${streamId}`,
        flv: `${streamingServerAPIUri}/stream/flv/${streamId}`,
        mp3: `${streamingServerAPIUri}/stream/mp3/${streamId}`,
    }
}