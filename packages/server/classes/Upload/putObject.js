import fs from "node:fs"
import path from "node:path"
import pMap from "p-map"

export default async function putObject({
	filePath,
	uploadPath,
	metadata = {},
	targetFilename,
	onFinish,
	onProgress,
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
		let count = 0

		const handleProgress = () => {
			if (typeof onProgress === "function") {
				count = count + 1

				onProgress({
					percent: Math.round((count / files.length) * 100),
					state: "uploading_s3",
				})
			}
		}

		files = files.map((file) => {
			const newPath = path.join(filePath, file)

			return {
				filePath: newPath,
				uploadPath: path.join(uploadPath, file),
				provider: provider,
				onFinish: handleProgress,
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
