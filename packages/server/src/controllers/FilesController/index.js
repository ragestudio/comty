import fs from "fs"

import { Controller } from "linebridge/dist/server"
import ChunkedUpload from "@lib/chunkedUpload"
import uploadBodyFiles from "./services/uploadBodyFiles"

import { videoTranscode } from "@lib/videoTranscode"
import Jimp from "jimp"

const maximuns = {
    imageResolution: {
        width: 3840,
        height: 2160,
    },
    imageQuality: 80,
}

async function processVideo(file, params = {}) {
    const result = await videoTranscode(file.filepath, global.uploadCachePath, {
        videoCodec: "libx264",
        format: "mp4",
        ...params
    })

    file.filepath = result.filepath
    file.filename = result.filename

    return file
}

async function processImage(file) {
    const { width, height } = await new Promise((resolve, reject) => {
        Jimp.read(file.filepath)
            .then((image) => {
                resolve({
                    width: image.bitmap.width,
                    height: image.bitmap.height,
                })
            })
            .catch((err) => {
                reject(err)
            })
    })

    if (width > maximuns.imageResolution.width || height > maximuns.imageResolution.height) {
        await new Promise((resolve, reject) => {
            Jimp.read(file.filepath)
                .then((image) => {
                    image
                        .resize(maximuns.imageResolution.width, maximuns.imageResolution.height)
                        .quality(maximuns.imageQuality)
                        .write(file.filepath, resolve)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    return file
}

export default class FilesController extends Controller {
    static refName = "FilesController"
    static useRoute = "/files"

    chunkUploadEngine = new ChunkedUpload({
        tmpPath: global.uploadCachePath,
        outputPath: global.uploadCachePath,
        maxFileSize: global.DEFAULT_POSTING_POLICY.maximumFileSize,
        acceptedMimeTypes: global.DEFAULT_POSTING_POLICY.acceptedMimeTypes,
        onExceedMaxFileSize: (req) => {
            // check if user has permission to upload big files
            if (!req.user) {
                return false
            }

            return req.user.roles.includes("admin") || req.user.roles.includes("moderator") || req.user.roles.includes("developer")
        }
    })

    fileTransformer = {
        "video/avi": processVideo,
        "video/quicktime": processVideo,
        "video/mp4": processVideo,
        "video/webm": processVideo,
        "image/jpeg": processImage,
        "image/png": processImage,
        "image/gif": processImage,
        "image/bmp": processImage,
        "image/tiff": processImage,
        "image/webp": processImage,
        "image/jfif": processImage,
    }

    httpEndpoints = {
        get: {
            "/objects": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const user_id = req.user.id

                    let totalSize = 0

                    const objectsPath = `${user_id}/`

                    const objects = await new Promise((resolve, reject) => {
                        const objects = []

                        const objectsStream = global.storage.listObjects(global.storage.defaultBucket, objectsPath, true)

                        objectsStream.on("data", (obj) => {
                            objects.push(obj)
                        })

                        objectsStream.on("error", (err) => {
                            return reject(err)
                        })

                        objectsStream.on("end", () => {
                            return resolve(objects)
                        })
                    })

                    for await (const object of objects) {
                        totalSize += object.size
                    }

                    return res.json({
                        totalSize,
                        objects,
                    })
                }
            }
        },
        post: {
            "/upload_chunk": {
                middlewares: ["withAuthentication", this.chunkUploadEngine.makeMiddleware()],
                fn: async (req, res) => {
                    if (!req.isLastPart) {
                        return res.json({
                            status: "ok",
                            filePart: req.filePart,
                            lastPart: req.isLastPart,
                        })
                    }

                    if (!req.fileResult) {
                        return res.status(500).json({
                            error: "File upload failed",
                        })
                    }

                    try {
                        // check if mimetype has transformer
                        if (typeof this.fileTransformer[req.fileResult.mimetype] === "function") {
                            req.fileResult = await this.fileTransformer[req.fileResult.mimetype](req.fileResult)
                        }
                    } catch (error) {
                        console.log(error)
                        return res.status(500).json({
                            error: "File upload failed",
                            reason: error.message,
                        })
                    }

                    // start upload to s3
                    const remoteUploadPath = req.user?._id ? `${req.user?._id.toString()}/${req.fileResult.filename}` : file.filename

                    const remoteUploadResponse = await new Promise((_resolve, _reject) => {
                        try {
                            const fileStream = fs.createReadStream(req.fileResult.filepath)

                            fs.stat(req.fileResult.filepath, (err, stats) => {
                                try {
                                    if (err) {
                                        return _reject(new Error(`Failed to upload file to storage server > ${err.message}`))
                                    }

                                    global.storage.putObject(global.storage.defaultBucket, remoteUploadPath, fileStream, stats.size, req.fileResult, (err, etag) => {
                                        if (err) {
                                            return _reject(new Error(`Failed to upload file to storage server > ${err.message}`))
                                        }

                                        return _resolve({
                                            etag,
                                        })
                                    })
                                } catch (error) {
                                    return _reject(new Error(`Failed to upload file to storage server > ${error.message}`))
                                }
                            })
                        } catch (error) {
                            return _reject(new Error(`Failed to upload file to storage server > ${error.message}`))
                        }
                    }).catch((err) => {
                        res.status(500).json({
                            error: err.message,
                        })

                        return false
                    })

                    if (!remoteUploadResponse) {
                        return false
                    }

                    try {
                        // remove file from cache
                        await fs.promises.unlink(req.fileResult.filepath)
                    } catch (error) {
                        console.log("Failed to remove file from cache", error)

                        return res.status(500).json({
                            error: error.message,
                        })
                    }

                    // get url location
                    const remoteUrlObj = global.storage.composeRemoteURL(remoteUploadPath)

                    return res.json({
                        name: req.fileResult.filename,
                        id: remoteUploadPath,
                        url: remoteUrlObj,
                    })
                }
            },
            "/upload": {
                middlewares: ["withAuthentication"],
                fn: async (req, res) => {
                    const results = await uploadBodyFiles({
                        req,
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
}