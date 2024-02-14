export default (image, numChannels) => {
    const pixels = image.data
    const numPixels = image.width * image.height

    const values = new Int32Array(numPixels * numChannels)

    for (let i = 0; i < numPixels; i++) {
        for (let channel = 0; channel < numChannels; ++channel) {
            values[i * numChannels + channel] = pixels[i * 4 + channel]
        }
    }

    return values
}