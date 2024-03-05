function RGBStringToValues(rgbString) {
    if (!rgbString) {
        return [0, 0, 0]
    }

    const rgb = rgbString.replace("rgb(", "").replace(")", "").split(",").map((v) => parseInt(v))

    return [rgb[0], rgb[1], rgb[2]]
}

export default RGBStringToValues