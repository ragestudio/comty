import path from "path"
import fs from "fs"

import * as Errors from "@classes/Errors"
import FileUpload from "@classes/FileUpload"
import useCompression from "@services/useCompression"

const cachePath = global.cache.constructor.cachePath

export default async (req, res) => {
    // extract authentification header
    let auth = req.session

    if (!auth) {
        return new Errors.AuthorizationError(req, res)
    }

    const userPath = path.join(cachePath, req.session.user_id)

    // 10 GB in bytes
    const maxFileSize = 10 * 1000 * 1000 * 1000

    // 10MB in bytes
    const maxChunkSize = 10 * 1000 * 1000

    let build = await FileUpload(req, userPath, maxFileSize, maxChunkSize)
        .catch((err) => {
            console.log("err", err)

            new Errors.InternalServerError(req, res, err.message)

            return false
        })

    if (build === false) {
        return false
    } else {
        if (typeof build === "function") {
            try {
                build = await build()

                if (!req.headers["no-compression"]) {
                    build = await useCompression(build)
                }

                // compose remote path
                const remotePath = `${req.session.user_id}/${path.basename(build.filepath)}`

                // upload to storage
                await global.storage.fPutObject(process.env.S3_BUCKET, remotePath, build.filepath)

                // remove from cache
                fs.promises.rm(build.cachePath, { recursive: true, force: true })

                // compose url
                const url = global.storage.composeRemoteURL(remotePath)

                return res.json({
                    name: build.filename,
                    id: remotePath,
                    url: url,
                })
            } catch (error) {
                console.log(error)
                return new Errors.InternalServerError(req, res, error.message)
            }
        }

        return res.json({
            success: true,
        })
    }
}