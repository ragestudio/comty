export default {
    method: "GET",
    route: "/streaming/addresses",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        const addresses = {
            api: process.env.STREAMING_API_SERVER,
            ingest: process.env.STREAMING_INGEST_SERVER,
        }

        if (req.user) {
            addresses.ingestURL = `${addresses.ingest}/${req.user.username}`

            addresses.liveURL = `${addresses.api}/live/${req.user.username}`
            addresses.radioURL = `${addresses.api}/radio/${req.user.username}`

            addresses.hlsURL = `${addresses.liveURL}/src.m3u8`
            addresses.flvURL = `${addresses.liveURL}/src.flv`
            
            addresses.aacURL = `${addresses.radioURL}/src.aac`
        }

        return res.json(addresses)
    }
}