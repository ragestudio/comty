import fs from "node:fs"
import Jimp from "jimp"
import mimetypes from "mime-types"

import videoTranscode from "@services/videoTranscode"

const cachePath = global.cache.constructor.cachePath

const fileTransformer = {
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

const maximuns = {
    imageResolution: {
        width: 3840,
        height: 2160,
    },
    imageQuality: 80,
}

async function processVideo(file) {
    if (!file) {
        throw new Error("file is required")
    }

    const result = await videoTranscode(file.filepath, file.cachePath, {
        videoCodec: "libx264",
        format: "mp4",
        audioBitrate: 128,
        videoBitrate: 1024,
    })

    file.filepath = result.filepath
    file.filename = result.filename

    return file
}

async function processImage(file) {
    if (!file) {
        throw new Error("file is required")
    }

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
            // calculate max resolution respecting aspect ratio
            const resizedResolution = {
                width: maximuns.imageResolution.width,
                height: maximuns.imageResolution.height,
            }

            if (width > height) {
                resizedResolution.height = Math.floor((height / width) * maximuns.imageResolution.width)
            }

            if (height > width) {
                resizedResolution.width = Math.floor((width / height) * maximuns.imageResolution.height)
            }

            Jimp.read(file.filepath)
                .then((image) => {
                    image
                        .resize(resizedResolution.width, resizedResolution.height)
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

export default async (file) => {
    if (!file) {
        throw new Error("file is required")
    }

    if (!fs.existsSync(file.filepath)) {
        throw new Error(`File ${file.filepath} not found`)
    }

    const fileMimetype = mimetypes.lookup(file.filepath)

    if (typeof fileTransformer[fileMimetype] !== "function") {
        console.warn(`File (${file.filepath}) has mimetype ${fileMimetype} and will not be processed`)

        return file
    }

    return await fileTransformer[fileMimetype](file)
}