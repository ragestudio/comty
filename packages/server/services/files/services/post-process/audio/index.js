const ffmpeg = require("fluent-ffmpeg")

export default async (file) => {
    // analize metadata
    let metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file.filepath, (err, data) => {
            if (err) {
                return reject(err)
            }

            resolve(data)
        })
    }).catch((err) => {
        console.error(err)

        return {}
    })

    if (metadata.format) {
        metadata = metadata.format
    }

    file.metadata = {
        duration: metadata.duration,
        bitrate: metadata.bit_rate,
        size: metadata.size,
    }

    return file
}