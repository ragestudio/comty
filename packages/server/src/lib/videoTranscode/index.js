import path from "path"

const ffmpeg = require("fluent-ffmpeg")

function videoTranscode(originalFilePath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
        const filename = path.basename(originalFilePath)
        const outputFilename = `${filename.split(".")[0]}.${options.format ?? "webm"}`
        const outputFilepath = `${outputPath}/${outputFilename}_transcoded`

        console.debug(`[TRANSCODING] Transcoding ${originalFilePath} to ${outputFilepath}`)

        const onEnd = async () => {
            console.debug(`[TRANSCODING] Finished transcode ${originalFilePath} to ${outputFilepath}`)

            return resolve({
                filepath: outputFilepath,
                filename: outputFilename,
            })
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