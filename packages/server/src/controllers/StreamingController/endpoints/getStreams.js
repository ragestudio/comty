import fetchRemoteStreams from "@services/fetchRemoteStreams"

export default {
    method: "GET",
    route: "/streams",
    fn: async (req, res) => {
        if (req.query.username) {
            const stream = await fetchRemoteStreams(`live/${req.query.username}${req.query.profile_id ? `:${req.query.profile_id}` : ""}`)

            if (!stream) {
                return res.status(404).json({
                    error: "Stream not found"
                })
            }

            return res.json(stream)
        } else {
            const streams = await fetchRemoteStreams()

            return res.json(streams)
        }
    }
}