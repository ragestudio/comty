import { FastAverageColor } from "fast-average-color"

export default class ContrastYIQ {
    static get facInstance() {
        return new FastAverageColor()
    }

    static async averageColor(image) {
        return await ContrastYIQ.facInstance.getColorAsync(image)
    }

    static fromHex(hexcolor) {
        const r = parseInt(hexcolor.substring(1, 3), 16)
        const g = parseInt(hexcolor.substring(3, 5), 16)
        const b = parseInt(hexcolor.substring(5, 7), 16)

        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000

        return (yiq >= 128) ? "black" : "white"
    }

    static async fromUrl(url) {
        const image = new Image()

        image.src = url + "?" + new Date().getTime()
        image.setAttribute("crossOrigin", "")

        const results = await ContrastYIQ.averageColor(image)

        return ContrastYIQ.fromHex(results.hex)
    }
}