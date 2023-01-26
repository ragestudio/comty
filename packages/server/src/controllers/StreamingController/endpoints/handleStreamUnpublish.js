import generateStreamDataFromStreamingKey from "../services/generateStreamDataFromStreamingKey"

export default {
    method: "POST",
    route: "/stream/unpublish",
    fn: async (req, res) => {
        const { stream } = req.body

        const streaming = await generateStreamDataFromStreamingKey(stream).catch((err) => {
            console.error(err)

            return null
        })

        if (streaming) {
            global.wsInterface.io.emit(`streaming.end`, streaming)

            global.wsInterface.io.emit(`streaming.end.${streaming.username}`, streaming)

            return res.json({
                code: 0,
                status: "ok"
            })
        }
    }
}