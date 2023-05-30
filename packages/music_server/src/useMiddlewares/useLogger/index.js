export default (req, res, next) => {
    const startHrTime = process.hrtime()

    res.on("finish", () => {
        const elapsedHrTime = process.hrtime(startHrTime)
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6

        res._responseTimeMs = elapsedTimeInMs

        // cut req.url if is too long
        if (req.url.length > 100) {
            req.url = req.url.substring(0, 100) + "..."
        }

        console.log(`${req.method} ${res._status_code ?? res.statusCode ?? 200} ${req.url} ${elapsedTimeInMs}ms`)
    })

    next()
}