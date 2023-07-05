import videoTranscode from "@services/videoTranscode"

/**
 * Processes a video file based on the specified options.
 *
 * @async
 * @param {Object} file - The video file to process.
 * @param {Object} [options={}] - The options object to use for processing.
 * @param {string} [options.videoCodec="libx264"] - The video codec to use.
 * @param {string} [options.format="mp4"] - The format to use.
 * @param {number} [options.audioBitrate=128] - The audio bitrate to use.
 * @param {number} [options.videoBitrate=1024] - The video bitrate to use.
 * @throws {Error} Throws an error if file parameter is not provided.
 * @return {Object} The processed video file object.
 */
async function processVideo(
    file,
    options = {}
) {
    if (!file) {
        throw new Error("file is required")
    }

    // TODO: Get values from db
    const {
        videoCodec = "libx264",
        format = "mp4",
        audioBitrate = 128,
        videoBitrate = 1024,
    } = options

    const result = await videoTranscode(file.filepath, file.cachePath, {
        videoCodec,
        format,
        audioBitrate,
        videoBitrate,
    })

    file.filepath = result.filepath
    file.filename = result.filename

    return file
}

export default processVideo