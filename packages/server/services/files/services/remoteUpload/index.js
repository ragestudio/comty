import fs from "node:fs"
import path from "node:path"
import mimeTypes from "mime-types"
import getFileHash from "@shared-utils/readFileHash"

import PostProcess from "../post-process"
import Transmux from "../transmux"

import StandardUpload from "./providers/standard"
import B2Upload from "./providers/b2"

export default async ({
	source,
	parentDir,
	service,
	useCompression,
	cachePath,
	transmux,
	transmuxOptions,
	isDirectory,
	onProgress,
}) => {
	if (!source) {
		throw new OperationError(500, "source is required")
	}

	if (!service) {
		service = "standard"
	}

	if (!parentDir) {
		parentDir = "/"
	}

	if (transmuxOptions) {
		transmuxOptions = JSON.parse(transmuxOptions)
	}

	if (useCompression) {
		if (typeof onProgress === "function") {
			onProgress(10, {
				event: "post_processing",
			})
		}

		try {
			const processOutput = await PostProcess({
				filepath: source,
				cachePath: cachePath,
			})

			if (processOutput) {
				if (processOutput.filepath) {
					source = processOutput.filepath
				}
			}
		} catch (error) {
			console.error(error)
			throw new OperationError(500, `Failed to process file`)
		}
	}

	if (transmux) {
		if (typeof onProgress === "function") {
			onProgress(30, {
				event: "transmuxing",
			})
		}

		try {
			const processOutput = await Transmux({
				transmuxer: transmux,
				transmuxOptions: transmuxOptions,
				filepath: source,
				cachePath: cachePath,
			})

			if (processOutput) {
				if (processOutput.filepath) {
					source = processOutput.filepath
				}

				if (processOutput.isDirectory) {
					isDirectory = true
				}
			}
		} catch (error) {
			console.error(error)
			throw new OperationError(500, `Failed to transmux file`)
		}
	}

	const type = mimeTypes.lookup(path.basename(source))
	const hash = await getFileHash(fs.createReadStream(source))

	let fileId = `${hash}`

	// FIXME: This is a walkaround to avoid to hashing the entire directories
	if (isDirectory) {
		fileId = global.nanoid()
	}

	let remotePath = path.join(parentDir, fileId)

	let result = {}

	const metadata = {
		"Content-Type": type,
		"File-Hash": hash,
	}

	if (typeof onProgress === "function") {
		onProgress(80, {
			event: "uploading_s3",
			service: service,
		})
	}

	try {
		switch (service) {
			case "b2":
				if (!global.b2Storage) {
					throw new OperationError(
						500,
						"B2 storage not configured on environment, unsupported service. Please use `standard` service.",
					)
				}

				result = await B2Upload({
					source: isDirectory ? path.dirname(source) : source,
					remotePath: remotePath,
					metadata: metadata,
					isDirectory: isDirectory,
					targetFilename: isDirectory ? path.basename(source) : null,
				})
				break
			case "standard":
				result = await StandardUpload({
					source: isDirectory ? path.dirname(source) : source,
					remotePath: remotePath,
					metadata: metadata,
					isDirectory: isDirectory,
					targetFilename: isDirectory ? path.basename(source) : null,
				})
				break
			default:
				throw new OperationError(500, "Unsupported service")
		}
	} catch (error) {
		console.error(error)
		throw new OperationError(500, "Failed to upload to storage")
	}

	if (typeof onProgress === "function") {
		onProgress(100, {
			event: "done",
			result: result,
		})
	}

	return result
}
