export default function getStreamingKeyFromStreamPath(StreamPath) {
    return StreamPath.split("/").pop()
}