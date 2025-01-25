export default {
    middlewares: [
        "withAuthentication",
        "onlyAdmin"
    ],
    fn: async (req, res) => {
        const payload = req.body ?? {}

        global.websocket.io.of("/").emit("notification.broadcast", {
            type: payload.type ?? "info",
            title: payload.title,
            message: payload.message,
            image: payload.image,
        })

        return res.json({ ok: true })
    }
}