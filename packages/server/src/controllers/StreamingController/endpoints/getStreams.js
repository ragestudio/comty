import fetchStreamsFromAPI from "../services/fetchStreamsFromAPI"

export default {
    method: "GET",
    route: "/streams",
    fn: async (req, res) => {
        const remoteStreams = await fetchStreamsFromAPI()

        if (req.query.username) {
            const stream = remoteStreams.find((stream) => stream.username === req.query.username)

            if (!stream) {
                return res.status(404).json({
                    error: "Stream not found"
                })
            }

            return res.json(stream)
        }

        return res.json(remoteStreams)
    }
}