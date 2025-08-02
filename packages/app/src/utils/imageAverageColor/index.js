import { FastAverageColor } from "fast-average-color"

export default async (url) => {
	if (typeof url !== "string") {
		throw new Error("url must be a string")
	}

	const fac = new FastAverageColor()
	const img = new Image()

	img.src = url + "?t=a"
	img.crossOrigin = "anonymous"

	return await fac.getColorAsync(img)
}
