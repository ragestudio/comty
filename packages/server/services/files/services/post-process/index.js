import fs from "node:fs"
import mimetypes from "mime-types"

import processVideo from "./video"
import processImage from "./image"
import processAudio from "./audio"

const fileTransformer = {
    // video
    "video/avi": processVideo,
    "video/quicktime": processVideo,
    "video/mp4": processVideo,
    "video/webm": processVideo,
    //image
    "image/jpeg": processImage,
    "image/png": processImage,
    "image/gif": processImage,
    "image/bmp": processImage,
    "image/tiff": processImage,
    "image/webp": processImage,
    "image/jfif": processImage,
    // audio
    "audio/flac": processAudio,
    "audio/x-flac": processAudio,
    "audio/mp3": processAudio,
    "audio/x-mp3": processAudio,
    "audio/mpeg": processAudio,
    "audio/x-mpeg": processAudio,
    "audio/ogg": processAudio,
    "audio/x-ogg": processAudio,
    "audio/wav": processAudio,
    "audio/x-wav": processAudio,
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
        console.debug(`File (${file.filepath}) has mimetype ${fileMimetype} and will not be processed`)

        return file
    }

    return await fileTransformer[fileMimetype](file)
}