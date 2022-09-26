import path from "path"
import fs from "fs"

const ffmpeg = require("fluent-ffmpeg")

function videoTranscode(originalFilePath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
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

export {
    videoTranscode,
}