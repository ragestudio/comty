import fs from "node:fs"
import path from "node:path"
import pMap from "p-map"

export default async function putObject({
	filePath,
	uploadPath,
	metadata = {},
	targetFilename,
	onFinish,
	provider = "standard",
}) {
	const providerClass = global.storages[provider]

	if (!providerClass) {
		throw new Error(`Provider [${provider}] not found`)
	}

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

		await pMap(files, putObject, {
			concurrency: 3,
		})

		return {
			id: uploadPath,
			url: providerClass.composeRemoteURL(uploadPath, targetFilename),
			metadata: metadata,
		}
	}

	// upload to storage
	await providerClass.fPutObject(
		process.env.S3_BUCKET,
		uploadPath,
		filePath,
		metadata,
	)

	const result = {
		id: uploadPath,
		url: providerClass.composeRemoteURL(uploadPath),
		metadata: metadata,
	}

	if (typeof onFinish === "function") {
		await onFinish(result)
	}

	return result
}
