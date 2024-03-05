async function serveRemoteStatic(req, res) {
    const path = req.path.replace("/static", "")

    global.storage.getObject(process.env.S3_BUCKET, path, (err, dataStream) => {
        if (err) {
            console.log(err)
            return res.status(404).send("Not Found")
        }

        // on end of stream, dispath res.on("finish")
        dataStream.on("end", () => {
            res.emit("finish")
            return res.end()
        })

        return dataStream.pipe(res)
    })
}

export default (router) => {
    router.get("*", (req, res) => serveRemoteStatic(req, res))

    return {
        path: "/static/",
        router,
    }
}