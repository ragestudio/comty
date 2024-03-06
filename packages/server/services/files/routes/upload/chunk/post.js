import path from "path"
import fs from "fs"

import FileUpload from "@shared-classes/FileUpload"
import PostProcess from "@services/post-process"

export default {
    useContext: ["cache", "storage", "b2Storage"],
    middlewares: [
        "withAuthentication",
    ],
    fn: async (req, res) => {
        const { cache, storage, b2Storage } = this.default.contexts

        const providerType = req.headers["provider-type"]

        const userPath = path.join(cache.constructor.cachePath, req.session.user_id)

        // 10 GB in bytes
        const maxFileSize = 10 * 1000 * 1000 * 1000

        // 10MB in bytes
        const maxChunkSize = 10 * 1000 * 1000

        let build = await FileUpload(req, userPath, maxFileSize, maxChunkSize)
            .catch((err) => {
                console.log("err", err)

                throw new OperationError(500, err.message)
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
                        case "premium-cdn": {
                            // use backblaze b2
                            await b2Storage.authorize()

                            const uploadUrl = await b2Storage.getUploadUrl({
                                bucketId: process.env.B2_BUCKET_ID,
                            })

                            const data = await fs.promises.readFile(build.filepath)

                            await b2Storage.uploadFile({
                                uploadUrl: uploadUrl.data.uploadUrl,
                                uploadAuthToken: uploadUrl.data.authorizationToken,
                                fileName: remotePath,
                                data: data,
                                info: build.metadata
                            })

                            url = `https://${process.env.B2_CDN_ENDPOINT}/${process.env.B2_BUCKET}/${remotePath}`

                            break
                        }
                        default: {
                            // upload to storage
                            await storage.fPutObject(process.env.S3_BUCKET, remotePath, build.filepath, build.metadata ?? {
                                "Content-Type": build.mimetype,
                            })

                            // compose url
                            url = storage.composeRemoteURL(remotePath)

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

                    throw new OperationError(500, error.message)
                }
            }

            return res.json({
                success: true,
            })
        }
    }
}