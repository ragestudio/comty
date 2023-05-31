import { Track } from "@models"
import { NotFoundError, InternalServerError } from "@shared-classes/Errors"

import mimetypes from "mime-types"

export default async (req, res) => {
    const { track_id } = req.params

    let track = await Track.findOne({
        _id: track_id,
        public: true,
    }).catch((err) => {
        return null
    })

    if (!track) {
        return new NotFoundError(req, res, "Track not found")
    }

    track = track.toObject()

    if (typeof track.stream_source === "undefined") {
        return new NotFoundError(req, res, "Track doesn't have stream source")
    }

    global.storage.getObject(process.env.S3_BUCKET, `tracks/${track.stream_source}`, (err, dataStream) => {
        if (err) {
            console.error(err)
            return new InternalServerError(req, res, "Error while getting file from storage")
        }

        const extname = mimetypes.lookup(track.stream_source)

        // send chunked response
        res.status(200)

        // set headers
        res.setHeader("Content-Type", extname)
        res.setHeader("Accept-Ranges", "bytes")

        return dataStream.pipe(res)
    })
}