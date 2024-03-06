import mimetypes from "mime-types"

export default {
    useContext: ["storage"],
    fn: async (req, res) => {
        const streamPath = req.path.replace(req.route.pattern.replace("*", ""), "/")

        this.default.contexts.storage.getObject(process.env.S3_BUCKET, streamPath, (err, dataStream) => {
            if (err) {
                return res.status(404).end()
            }

            const extname = mimetypes.lookup(streamPath)

            // send chunked response
            res.status(200)

            // set headers
            res.setHeader("Content-Type", extname)
            res.setHeader("Accept-Ranges", "bytes")

            return dataStream.pipe(res)
        })
    }
}