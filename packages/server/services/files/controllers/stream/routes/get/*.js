import { NotFoundError, InternalServerError } from "@shared-classes/Errors"
import mimetypes from "mime-types"

export default async (req, res) => {
    const streamPath = req.params[0]

    global.storage.getObject(process.env.S3_BUCKET, streamPath, (err, dataStream) => {
        if (err) {
            console.error(err)
            return new InternalServerError(req, res, "Error while getting file from storage")
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