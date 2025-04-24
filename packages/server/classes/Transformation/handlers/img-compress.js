import fs from "node:fs"
import path from "node:path"

import Sharp from "sharp"

const imageProcessingConf = {
	sizeThreshold: 10 * 1024 * 1024,
	imageQuality: 80,
}

const imageTypeToConfig = {
	png: {
		compressionLevel: Math.floor(imageProcessingConf.imageQuality / 100),
	},
	default: {
		quality: imageProcessingConf.imageQuality,
	},
}

export default async ({ filePath, workPath }) => {
	const stat = await fs.promises.stat(file.filepath)

	// ignore if too small
	if (stat.size < imageProcessingConf.sizeThreshold) {
		return file
	}

	let image = await Sharp(filePath)

	const { format } = await image.metadata()

	image = await image[format](
		imageTypeToConfig[format] ?? imageTypeToConfig.default,
	).withMetadata()

	filePath = path.resolve(workPath, `${path.basename(filePath)}_ff`)

	await image.toFile(outputFilepath)

	return {
		filePath: filePath,
	}
}
