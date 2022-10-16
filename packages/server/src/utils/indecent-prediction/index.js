const tf = require("@tensorflow/tfjs-node")
import * as nsfwjs from "nsfwjs/dist"
import sharp from "sharp"

import fs from "fs"
import path from "path"

import readImage from "../read-image"
import imageByteArray from "../image-byte-array"

const imageToInput = (image, numChannels) => {
    const values = imageByteArray(image, numChannels)
    const outShape = [image.height, image.width, numChannels]
    const input = tf.tensor3d(values, outShape, "int32")

    return input
}

export default async (payload) => {
    let { image, channels = 3 } = payload

    const model = await nsfwjs.load()

    // check if image is not a jpg
    if (image.indexOf(".jpg") === -1) {
        // convert image to jpg
        const converted = await sharp(image)
            .jpeg()
            .toBuffer()

        // write converted image to disk (use cache)
        const destination = path.resolve(global.uploadCachePath, `${Date.now()}.jpg`)

        fs.writeFileSync(destination, converted)

        // set image to the converted image
        image = destination
    }

    const logo = readImage(image)
    const input = imageToInput(logo, channels)

    const predictions = await model.classify(input)

    return predictions
}