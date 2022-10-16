const tf = require("@tensorflow/tfjs-node")
import * as nsfwjs from "nsfwjs/dist"

import readImage from "../read-image"
import imageByteArray from "../imageByteArray"

const imageToInput = (image, numChannels) => {
    const values = imageByteArray(image, numChannels)
    const outShape = [image.height, image.width, numChannels]
    const input = tf.tensor3d(values, outShape, "int32")

    return input
}

export default async (payload) => {
    let { image, channels = 3 } = payload

    const model = await nsfwjs.load()

    const logo = readImage(image)
    const input = imageToInput(logo, channels)

    const predictions = await model.classify(input)

    return predictions
}