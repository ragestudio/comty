import fs from "node:fs"
import path from "node:path"
import pMap from "p-map"

export default async function standardUpload({
	filePath,
	uploadPath,
	metadata = {},
	targetFilename,
	onFinish,
}) {
	const isDirectory = await fs.promises
		.lstat(filePath)
		.then((stats) => stats.isDirectory())

	if (isDirectory) {
		let files = await fs.promises.readdir(filePath)

		files = files.map((file) => {
			const newPath = path.join(filePath, file)

			return {
				filePath: newPath,
				uploadPath: path.join(uploadPath, file),
			}
		})

		await pMap(files, standardUpload, {
			concurrency: 3,
		})

		return {
			id: uploadPath,
			url: global.storage.composeRemoteURL(uploadPath, targetFilename),
			metadata: metadata,
		}
	}

	// upload to storage
	await global.storage.fPutObject(
		process.env.S3_BUCKET,
		uploadPath,
		filePath,
		metadata,
	)

	const result = {
		id: uploadPath,
		url: global.storage.composeRemoteURL(uploadPath),
		metadata: metadata,
	}

	if (typeof onFinish === "function") {
		await onFinish(result)
	}

	return result
}
