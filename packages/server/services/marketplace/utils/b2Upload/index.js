import fs from "node:fs"
import path from "node:path"
import pMap from "p-map"

export default async function b2Upload({
	source,
	remotePath,
	metadata = {},
	targetFilename,
	isDirectory,
	retryNumber = 0,
}) {
	if (isDirectory) {
		let files = await fs.promises.readdir(source)

		files = files.map((file) => {
			const filePath = path.join(source, file)

			const isTargetDirectory = fs.lstatSync(filePath).isDirectory()

			return {
				source: filePath,
				remotePath: path.join(remotePath, file),
				isDirectory: isTargetDirectory,
			}
		})

		await pMap(files, b2Upload, {
			concurrency: 5,
		})

		return {
			id: remotePath,
			url: `https://${process.env.B2_CDN_ENDPOINT}/${process.env.B2_BUCKET}/${remotePath}/${targetFilename}`,
			metadata: metadata,
		}
	}

	try {
		//await global.b2.authorize()

		if (!fs.existsSync(source)) {
			throw new OperationError(500, "File not found")
		}

		const uploadUrl = await global.b2.getUploadUrl({
			bucketId: process.env.B2_BUCKET_ID,
		})

		console.debug(`Uploading object to B2 Storage >`, {
			source: source,
			remote: remotePath,
		})

		const data = await fs.promises.readFile(source)

		await global.b2.uploadFile({
			uploadUrl: uploadUrl.data.uploadUrl,
			uploadAuthToken: uploadUrl.data.authorizationToken,
			fileName: remotePath,
			data: data,
			info: metadata,
		})
	} catch (error) {
		console.error(error)

		if (retryNumber < 5) {
			return await b2Upload({
				source,
				remotePath,
				metadata,
				targetFilename,
				isDirectory,
				retryNumber: retryNumber + 1,
			})
		}

		throw new OperationError(500, "B2 upload failed")
	}

	return {
		id: remotePath,
		url: `https://${process.env.B2_CDN_ENDPOINT}/${process.env.B2_BUCKET}/${remotePath}`,
		metadata: metadata,
	}
}
