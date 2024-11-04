import path from "path"

const ffmpeg = require("fluent-ffmpeg")

const defaultParams = {
    audioBitrate: 128,
    videoBitrate: 1024,
    videoCodec: "libvpx",
    audioCodec: "libvorbis",
    format: "webm",
}

const maxTasks = 5

export default (input, params = defaultParams) => {
    return new Promise((resolve, reject) => {
        if (!global.ffmpegTasks) {
            global.ffmpegTasks = []
        }

        if (global.ffmpegTasks.length >= maxTasks) {
            return reject(new Error("Too many transcoding tasks"))
        }

        const outputFilename = `${path.basename(input).split(".")[0]}_ff.${params.format ?? "webm"}`
        const outputFilepath = `${path.dirname(input)}/${outputFilename}`

        console.debug(`[TRANSCODING] Transcoding ${input} to ${outputFilepath}`)

        const onEnd = async () => {
            console.debug(`[TRANSCODING] Finished transcode ${input} to ${outputFilepath}`)

            return resolve({
                filename: outputFilename,
                filepath: outputFilepath,
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
            preset: "ultrafast",
            output: outputFilepath,
        }

        // chain methods
        for (let key in commands) {
            if (exec === null) {
                exec = ffmpeg(commands[key])
                continue
            }

            if (key === "extraOptions" && Array.isArray(commands[key])) {
                for (const option of commands[key]) {
                    exec = exec.inputOptions(option)
                }

                continue
            }

            if (typeof exec[key] !== "function") {
                console.warn(`[TRANSCODING] Method ${key} is not a function`)
                return false
            }

            if (Array.isArray(commands[key])) {
                exec = exec[key](...commands[key])
            } else {
                exec = exec[key](commands[key])
            }

            continue
        }

        exec
            .on("error", onError)
            .on("end", onEnd)
            .run()
    })
}