import path from "path"
import fs from "fs"
import { videoTranscode } from "@lib/videoTranscode"
import Jimp from "jimp"
import mime from "mime-types"

import pmap from "@utils/pMap"

const formidable = require("formidable")

const maximuns = {
    imageResolution: {
        width: 3840,
        height: 2160,
    },
    imageQuality: 80,
}

const handleUploadVideo = async (file, params) => {
    const transcoded = await videoTranscode(file.filepath, params.cacheUploadDir)

    file.filepath = transcoded.filepath
    file.newFilename = path.basename(file.filepath)

    return file
}

const handleImage = async (file) => {
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

    file.newFilename = path.basename(file.filepath)

    return file
}

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

    const processedFiles = []
    const failedFiles = []

    let queuePromieses = []

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
        filename: (name, ext, part, form) => {
            if (!ext) {
                ext = `.${mime.extension(part.mimetype)}`
            }

            name = global.nanoid()

            return name + ext
        },
        filter: (stream) => {
            // check if is allowed mime type
            if (!params.acceptedMimeTypes.includes(stream.mimetype)) {
                failedFiles.push({
                    fileName: stream.originalFilename,
                    mimetype: stream.mimetype,
                    error: "File type not allowed",
                })

                return false
            }

            return true
        }
    })

    const results = await new Promise((resolve, reject) => {
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
                            file = await handleUploadVideo(file, params)
                            break
                        }
                        case "image/jpeg": {
                            file = await handleImage(file, params)
                            break
                        }
                        case "image/png": {
                            file = await handleImage(file, params)
                            break
                        }
                        case "image/gif": {
                            file = await handleImage(file, params)
                            break
                        }
                        case "image/bmp": {
                            file = await handleImage(file, params)
                            break
                        }
                        case "image/tiff": {
                            file = await handleImage(file, params)
                            break
                        }
                        case "image/webp": {
                            file = await handleImage(file, params)
                            break
                        }
                        case "image/jfif": {
                            file = await handleImage(file, params)
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

                    // upload path must be user_id + file.newFilename
                    const uploadPath = req.user?._id ? `${req.user?._id.toString()}/${file.newFilename}` : file.newFilename

                    // upload to s3
                    await new Promise((_resolve, _reject) => {
                        global.storage.fPutObject(global.storage.defaultBucket, uploadPath, file.filepath, metadata, (err, etag) => {
                            if (err) {
                                return _reject(new Error(`Failed to upload file to storage server > ${err.message}`))
                            }

                            return _resolve()
                        })
                    }).catch((err) => {
                        return reject(err)
                    })

                    // get url location
                    const remoteUrlObj = global.storage.composeRemoteURL(uploadPath)

                    // push final filepath to urls
                    return {
                        name: file.originalFilename,
                        id: uploadPath,
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

                        // FIXME: add fileNames
                        failedFiles.push({
                            error: err.message,
                        })

                        return null
                    })

                    if (result) {
                        processedFiles.push(result)
                    }
                },
                { concurrency: 10 }
            )


            
            return resolve({
                files: processedFiles,
                failed: failedFiles,
            })
        })
    })

    return results
}