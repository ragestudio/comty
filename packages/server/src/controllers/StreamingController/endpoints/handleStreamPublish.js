import generateStreamDataFromStreamingKey from "../services/generateStreamDataFromStreamingKey"

// This endpoint is used by the streaming server to check if a stream is valid and to notify the clients that a stream has started

export default {
    method: "POST",
    route: "/stream/publish",
    fn: async (req, res) => {
        const { stream } = req.body

        const streaming = await generateStreamDataFromStreamingKey(stream).catch((err) => {
            console.error(err)

            res.status(500).json({
                error: `Cannot generate stream: ${err.message}`,
            })

            return null
        })

        if (streaming) {
            global.wsInterface.io.emit(`streaming.new`, streaming)

            global.wsInterface.io.emit(`streaming.new.${streaming.username}`, streaming)

            return res.json({
                code: 0,
                status: "ok"
            })
        }
    }
}