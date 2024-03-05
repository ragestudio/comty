export default (req, res) => {
    console.log(res.sse)
    if (!res.sse) {
        return res.json({
            error: "Server event stream is not enabled.",
            details: "SSE is required for this request."
        })
    }

    res.sse.open()

    res.sse.uid = req.params.sse_uid
    global.ssePools[req.params.sse_uid] = res.sse

    const pingInterval = setInterval(() => {
        res.sse.send("ping")
    }, 1000)

    res.once("close", () => {
        clearInterval(pingInterval)
        delete global.ssePools[req.params.sse_uid]
    })

    res.status(200)
    res.header('Content-Type', "text/event-stream")
    res.header('Cache-Control', 'no-cache')
    res.header('Connection', 'keep-alive')
}