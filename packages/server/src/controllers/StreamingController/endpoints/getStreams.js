import fetchStreamsFromAPI from "../services/fetchStreamsFromAPI"

export default {
    method: "GET",
    route: "/streams",
    fn: async (req, res) => {
        const remoteStreams = await fetchStreamsFromAPI()

        return res.json(remoteStreams)
    }
}