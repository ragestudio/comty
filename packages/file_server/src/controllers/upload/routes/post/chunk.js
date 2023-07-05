import path from "path"
import fs from "fs"

import * as Errors from "@shared-classes/Errors"
import FileUpload from "@shared-classes/FileUpload"
import PostProcess from "@services/post-process"

const cachePath = global.cache.constructor.cachePath

export default async (req, res) => {
    // extract authentification header
    let auth = req.session

    if (!auth) {
        return new Errors.AuthorizationError(req, res)
    }

    const providerType = req.headers["provider-type"]

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
                    build = await PostProcess(build)
                }

                // compose remote path
                const remotePath = `${req.session.user_id}/${path.basename(build.filepath)}`

                let url = null

                switch (providerType) {
                    case "music": {
                        console.debug("uploading to backblaze b2")

                        // use backblaze b2
                        await global.b2Storage.authorize()

                        const uploadUrl = await global.b2Storage.getUploadUrl({
                            bucketId: process.env.B2_BUCKET_ID,
                        })

                        const data = await fs.promises.readFile(build.filepath)

                        await global.b2Storage.uploadFile({
                            uploadUrl: uploadUrl.data.uploadUrl,
                            uploadAuthToken: uploadUrl.data.authorizationToken,
                            fileName: remotePath,
                            data: data,
                            info: build.metadata
                        })

                        url = path.join(`https://`, process.env.B2_ENDPOINT, process.env.B2_BUCKET, remotePath)

                        break
                    }
                    default: {
                        console.debug("uploading to minio")
                        // upload to storage
                        await global.storage.fPutObject(process.env.S3_BUCKET, remotePath, build.filepath, build.metadata ?? {
                            "Content-Type": build.mimetype,
                        })

                        // compose url
                        url = global.storage.composeRemoteURL(remotePath)

                        break
                    }
                }

                // remove from cache
                fs.promises.rm(build.cachePath, { recursive: true, force: true })

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