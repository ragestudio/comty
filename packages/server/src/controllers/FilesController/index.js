import { Controller } from "linebridge/dist/server"
import path from "path"
import fs from "fs"
import stream from "stream"
import pmap from "../../utils/pMap"

const formidable = require("formidable")

function resolveToUrl(filepath, req) {
    const host = req ? (req.protocol + "://" + req.get("host")) : global.globalPublicURI

    return `${host}/upload/${filepath}`
}

// TODO: Get maximunFileSize by type of user subscription (free, premium, etc) when `PermissionsAPI` is ready
const maximumFileSize = 80 * 1024 * 1024 // max file size in bytes (80MB) By default, the maximum file size is 80MB.
const maximunFilesPerRequest = 20
const acceptedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
]

function videoTranscode(originalFilePath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
        const ffmpeg = require("fluent-ffmpeg")

        const filename = path.basename(originalFilePath)
        const outputFilepath = `${outputPath}/${filename.split(".")[0]}.${options.format ?? "webm"}`

        console.debug(`[TRANSCODING] Transcoding ${originalFilePath} to ${outputFilepath}`)

        const onEnd = async () => {
            // remove
            await fs.promises.unlink(originalFilePath)

            console.debug(`[TRANSCODING] Transcoding ${originalFilePath} to ${outputFilepath} finished`)

            return resolve(outputFilepath)
        }

        const onError = (err) => {
            console.error(`[TRANSCODING] Transcoding ${originalFilePath} to ${outputFilepath} failed`, err)

            return reject(err)
        }

        ffmpeg(originalFilePath)
            .audioBitrate(options.audioBitrate ?? 128)
            .videoBitrate(options.videoBitrate ?? 1024)
            .videoCodec(options.videoCodec ?? "libvpx")
            .audioCodec(options.audioCodec ?? "libvorbis")
            .format(options.format ?? "webm")
            .output(outputFilepath)
            .on("error", onError)
            .on("end", onEnd)
            .run()
    })
}

export default class FilesController extends Controller {
    get = {
        "/upload/:id": {
            fn: (req, res) => {
                const filePath = path.join(global.uploadPath, req.params?.id)

                const readStream = fs.createReadStream(filePath)
                const passTrough = new stream.PassThrough()

                stream.pipeline(readStream, passTrough, (err) => {
                    if (err) {
                        return res.status(400)
                    }
                })

                return passTrough.pipe(res)
            },
        }
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

                if (!fs.existsSync(global.uploadPath)) {
                    await fs.promises.mkdir(global.uploadPath, { recursive: true })
                }

                // decode body form-data
                const form = formidable({
                    multiples: true,
                    keepExtensions: true,
                    uploadDir: global.uploadCachePath,
                    maxFileSize: maximumFileSize,
                    maxFields: maximunFilesPerRequest,
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

                                // move file to upload path
                                await fs.promises.rename(file.filepath, path.join(global.uploadPath, file.newFilename))

                                // push final filepath to urls
                                return {
                                    name: file.originalFilename,
                                    id: file.newFilename,
                                    url: resolveToUrl(file.newFilename, req),
                                }
                            })
                        }

                        // wait for all files to be processed
                        await pmap(queuePromieses,
                            async (fn) => {
                                const result = await fn().catch((err) => {
                                    console.error(err)

                                    return null
                                })

                                if (result) {
                                    processedFiles.push(result)
                                }
                            },
                            {
                                concurrency: 5
                            }
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