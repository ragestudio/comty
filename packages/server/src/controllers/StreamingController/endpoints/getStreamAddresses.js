export default {
    method: "GET",
    route: "/stream/addresses",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        const addresses = {
            api: process.env.STREAMING_INGEST_SERVER,
            ingest: process.env.STREAMING_API_SERVER,
        }

        if (req.user) {
            addresses.liveURL = `${addresses.api}/live/${req.user.username}`
            addresses.ingestURL = `${addresses.ingest}/${req.user.username}`

            addresses.hlsURL = `${addresses.liveURL}/src.m3u8`
            addresses.flvURL = `${addresses.liveURL}/src.flv`
        }

        return res.json(addresses)
    }
}