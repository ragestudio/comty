const minumunPredictions = {
    "Drawing": 0.8,
    "Hentai": 0.8,
    "Porn": 0.7,
}

export default (predictions) => {
    if (!Array.isArray(predictions)) {
        throw new Error("predictions must be an array")
    }

    let isNsfw = false

    Object.keys(minumunPredictions).forEach((key) => {
        const prediction = predictions.find((prediction) => prediction.className === key)

        if (prediction && prediction.probability >= minumunPredictions[key]) {
            isNsfw = true
        }
    })

    return isNsfw
}