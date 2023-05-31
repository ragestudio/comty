import path from "path"

const ffmpeg = require("fluent-ffmpeg")

const defaultParams = {
    audioBitrate: 128,
    videoBitrate: 1024,
    videoCodec: "libvpx",
    audioCodec: "libvorbis",
    format: "webm",
}

export default (input, cachePath, params = defaultParams) => {
    return new Promise((resolve, reject) => {
        const filename = path.basename(input)
        const outputFilename = `${filename.split(".")[0]}_ff.${params.format ?? "webm"}`
        const outputFilepath = `${cachePath}/${outputFilename}`

        console.debug(`[TRANSCODING] Transcoding ${input} to ${outputFilepath}`)

        const onEnd = async () => {
            console.debug(`[TRANSCODING] Finished transcode ${input} to ${outputFilepath}`)

            return resolve({
                filepath: outputFilepath,
                filename: outputFilename,
            })
        }

        const onError = (err) => {
            console.error(`[TRANSCODING] Transcoding ${input} to ${outputFilepath} failed`, err)

            return reject(err)
        }

        let exec = null

        const commands = {
            input: input,
            ...params,
            output: outputFilepath,
        }

        // chain methods
        Object.keys(commands).forEach((key) => {
            if (exec === null) {
                exec = ffmpeg(commands[key])
            } else {
                if (typeof exec[key] !== "function") {
                    console.warn(`[TRANSCODING] Method ${key} is not a function`)
                    return false
                }
                exec = exec[key](commands[key])
            }
        })

        exec
            .on("error", onError)
            .on("end", onEnd)
            .run()
    })
}