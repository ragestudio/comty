import { Controller } from "linebridge/dist/server"
import path from "path"
import fs from "fs"

import pmap from "../../utils/pMap"
import { videoTranscode } from "../../lib/videoTranscode"

const formidable = require("formidable")

// TODO: Get maximunFileSize by type of user subscription (free, premium, etc) when `PermissionsAPI` is ready
const maximumFileSize = 80 * 1024 * 1024 // max file size in bytes (80MB) By default, the maximum file size is 80MB.
const maximunFilesPerRequest = 20
const acceptedMimeTypes = [
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/gif",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/flac",
    "video/mp4",
    "video/mkv",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
]

export default class FilesController extends Controller {
    get = {
        "/upload/uploadPolicy": () => {
            return {
                acceptedMimeTypes,
                maximumFileSize,
                maximunFilesPerRequest,
            }
        },
    }

    post = {
        "/upload": {
            middlewares: ["withAuthentication"],
            fn: async (req, res) => {
                let failed = []

                // check directories exist
                if (!fs.existsSync(global.uploadCachePath)) {
                    await fs.promises.mkdir(global.uploadCachePath, { recursive: true })
                }

                // decode body form-data
                const form = formidable({
                    multiples: true,
                    keepExtensions: true,
                    uploadDir: global.uploadCachePath,
                    maxFileSize: maximumFileSize,
                    maxFields: maximunFilesPerRequest,
                    filename: (name, ext) => {
                        name = name.trim()
                        name = name.replace(/ /g, "_")
                        name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

                        return name + ext
                    },
                    filter: (stream) => {
                        // check if is allowed mime type
                        if (!acceptedMimeTypes.includes(stream.mimetype)) {
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

                        return resolve(processedFiles)
                    })
                }).catch((err) => {
                    res.status(400).json({
                        error: err.message,
                    })

                    return false
                })

                if (results) {
                    return res.json(results)
                }
            }
        }
    }
}