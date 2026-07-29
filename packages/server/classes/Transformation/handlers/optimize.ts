import fs from "node:fs"
import path from "node:path"
import Sharp from "sharp"
import { fileTypeFromBuffer } from "file-type"

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

async function readAsBuffer(input: string) {
	let buffer: Buffer = null
	let totalFileSize: number = 0

	if (input.startsWith("http://") || input.startsWith("https://")) {
		const options = {
			method: "GET",
			headers: {},
		}

		const response = await fetch(input, options)

		totalFileSize = Number(response.headers.get("content-length")) || 0
		buffer = Buffer.from(await response.arrayBuffer())
	} else {
		const stat = await fs.promises.stat(input)

		totalFileSize = stat.size
		buffer = await fs.promises.readFile(input, {
			encoding: null,
		})
	}

	return { buffer, totalFileSize }
}

export default async ({ filePath, workPath, onProgress }) => {
	let { buffer, totalFileSize } = await readAsBuffer(filePath)
	const fileType = await fileTypeFromBuffer(buffer)

	// first check if size over threshold
	if (totalFileSize < thresholds.size) {
		return null
	}

	let metadata: Record<string, any> = {}

	// get the type of the file mime
	const type = fileType.mime.split("/")[0]

	switch (type) {
		case "image": {
			let image = Sharp(buffer)

			const originalMetadata = await image.metadata()
			const config =
				sharpConfigs[originalMetadata.format] ?? sharpConfigs.default

			image = await image[originalMetadata.format](config).withMetadata()
			filePath = path.resolve(workPath, `${path.basename(filePath)}_ff`)

			const finalMetadata = await image.metadata()

			metadata["content-type"] = finalMetadata.mediaType
			//metadata["file-hash"] = image

			await image.toFile(filePath)
		}
	}

	return {
		outputFile: filePath,
		metadata: metadata,
	}
}
