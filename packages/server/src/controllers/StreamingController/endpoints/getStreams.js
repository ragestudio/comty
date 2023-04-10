import fetchStreamsFromAPI from "../services/fetchStreamsFromAPI"

export default {
    method: "GET",
    route: "/streams",
    fn: async (req, res) => {
        if (req.query.username) {
            const stream = await fetchStreamsFromAPI(`live/${req.query.username}${req.query.profile_id ? `:${req.query.profile_id}` : ""}`)

            if (!stream) {
                return res.status(404).json({
                    error: "Stream not found"
                })
            }

            return res.json(stream)
        } else {
            const streams = await fetchStreamsFromAPI()

            return res.json(streams)
        }
    }
}