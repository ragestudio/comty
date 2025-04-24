import fs from "node:fs"
import path from "node:path"
import { fileTypeFromBuffer } from "file-type"

import readChunk from "@shared-utils/readChunk"

import Sharp from "sharp"

const thresholds = {
	size: 10 * 1024 * 1024,
}

const sharpConfigs = {
	png: {
		compressionLevel: 6,
		//quality: 80,
	},
	jpeg: {
		quality: 80,
		mozjpeg: true,
	},
	default: {
		quality: 80,
	},
}

export default async ({ filePath, workPath, onProgress }) => {
	const stat = await fs.promises.stat(filePath)

	const firstBuffer = await readChunk(filePath, {
		length: 4100,
	})
	const fileType = await fileTypeFromBuffer(firstBuffer)

	// first check if size over threshold
	if (stat.size < thresholds.size) {
		return {
			outputFile: filePath,
		}
	}

	// get the type of the file mime
	const type = fileType.mime.split("/")[0]

	switch (type) {
		case "image": {
			let image = Sharp(filePath)

			const metadata = await image.metadata()
			const config = sharpConfigs[metadata.format] ?? sharpConfigs.default

			image = await image[metadata.format](config).withMetadata()

			filePath = path.resolve(workPath, `${path.basename(filePath)}_ff`)

			await image.toFile(filePath)
		}
	}

	return {
		outputFile: filePath,
	}
}
