import path from "path"
import fs from "fs"

import pmap from "../../../utils/pMap"

const formidable = require("formidable")

export default async (payload) => {
    if (!payload) {
        throw new Error("Missing payload")
    }

    const { req } = payload

    let params = {
        cacheUploadDir: global.uploadCachePath,
        maxFileSize: global.DEFAULT_POSTING_POLICY.maximumFileSize,
        maxFields: global.DEFAULT_POSTING_POLICY.maximunFilesPerRequest,
        acceptedMimeTypes: global.DEFAULT_POSTING_POLICY.acceptedMimeTypes,
    }

    if (payload.params) {
        params = {
            ...params,
            ...payload.params,
        }
    }

    let failed = []

    // check directories exist
    if (!fs.existsSync(params.cacheUploadDir)) {
        await fs.promises.mkdir(params.cacheUploadDir, { recursive: true })
    }

    // decode body form-data
    const form = formidable({
        multiples: true,
        keepExtensions: true,
        uploadDir: params.cacheUploadDir,
        maxFileSize: params.maxFileSize,
        maxFields: params.maxFields,
        filename: (name, ext) => {
            name = name.trim()
            name = name.replace(/ /g, "_")
            name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

            return name + ext
        },
        filter: (stream) => {
            // check if is allowed mime type
            if (!params.acceptedMimeTypes.includes(stream.mimetype)) {
                failed.push({
                    fileName: file.originalFilename,
                    mimetype: file.mimetype,
                    error: "mimetype not allowed",
                })

                return false
            }

            return true
        }
    })

    const results = await new Promise((resolve, reject) => {
        const processedFiles = []
        const failedFiles = []

        let queuePromieses = []

        // create a new thread for each file
        form.parse(req, async (err, fields, data) => {
            if (err) {
                return reject(err)
            }

            if (!Array.isArray(data.files)) {
                data.files = [data.files]
            }

            for (let file of data.files) {
                if (!file) continue

                // create process queue
                queuePromieses.push(async () => {
                    // check if is video need to transcode
                    switch (file.mimetype) {
                        case "video/quicktime": {
                            file.filepath = await videoTranscode(file.filepath, global.uploadCachePath)
                            file.newFilename = path.basename(file.filepath)
                            break
                        }

                        default: {
                            // do nothing
                        }
                    }

                    const metadata = {
                        mimetype: file.mimetype,
                        size: file.size,
                        filepath: file.filepath,
                        filename: file.newFilename,
                    }

                    // upload to s3
                    await new Promise((_resolve, _reject) => {
                        global.storage.fPutObject(global.storage.defaultBucket, file.newFilename, file.filepath, metadata, (err, etag) => {
                            if (err) {
                                return _reject(new Error(`Failed to upload file to storage server > ${err.message}`))
                            }

                            return _resolve()
                        })
                    }).catch((err) => {
                        return reject(err)
                    })

                    // remove file from cache
                    await fs.promises.unlink(file.filepath)

                    // get url location
                    const remoteUrlObj = global.storage.composeRemoteURL(file.newFilename)

                    // push final filepath to urls
                    return {
                        name: file.originalFilename,
                        id: file.newFilename,
                        url: remoteUrlObj,
                    }
                })
            }

            // wait for all files to be processed
            await pmap(
                queuePromieses,
                async (fn) => {
                    const result = await fn().catch((err) => {
                        console.error(err)
                        failedFiles.push(err)

                        return null
                    })

                    if (result) {
                        processedFiles.push(result)
                    }
                },
                { concurrency: 5 }
            )

            return resolve({
                files: processedFiles,
                failed: failedFiles,
            })
        })
    })

    return results
}