import fs from "node:fs"
import path from "node:path"
import Sharp from "sharp"

const imageProcessingConf = {
    // TODO: Get image sizeThreshold from DB
    sizeThreshold: 10 * 1024 * 1024,
    // TODO: Get image quality from DB
    imageQuality: 80,
}

const imageTypeToConfig = {
    png: {
        compressionLevel: Math.floor(imageProcessingConf.imageQuality / 100),
    },
    default: {
        quality: imageProcessingConf.imageQuality
    }
}

/**
 * Processes an image file and transforms it if it's above a certain size threshold.
 *
 * @async
 * @function
 * @param {Object} file - The file to be processed.
 * @param {string} file.filepath - The path of the file to be processed.
 * @param {string} file.hash - The hash of the file to be processed.
 * @param {string} file.cachePath - The cache path of the file to be processed.
 * @throws {Error} If the file parameter is not provided.
 * @return {Object} The processed file object.
 */
async function processImage(file) {
    if (!file) {
        throw new Error("file is required")
    }

    const stat = await fs.promises.stat(file.filepath)

    if (stat.size < imageProcessingConf.sizeThreshold) {
        return file
    }

    let image = await Sharp(file.filepath)

    const { format } = await image.metadata()

    image = await image[format](imageTypeToConfig[format] ?? imageTypeToConfig.default).withMetadata()

    const outputFilepath = path.resolve(file.cachePath, `${file.hash}_transformed.${format}`)

    await transformResult.toFile(outputFilepath)

    file.filepath = outputFilepath

    return file
}

export default processImage