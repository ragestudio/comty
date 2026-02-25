// Orginal forked from: Buzut/huge-uploader-nodejs
// Copyright (c) 2018, Quentin Busuttil All rights reserved.

import fs from "node:fs"
import path from "node:path"

export function checkTotalSize(
	chunkSize, // in bytes
	totalChunks, // number of chunks
	maxFileSize, // in bytes
) {
	const totalSize = chunkSize * totalChunks

	if (totalSize > maxFileSize) {
		return false
	}

	return true
}

export function checkChunkUploadHeaders(headers) {
	const requiredHeaders = [
		"uploader-chunk-number",
		"uploader-chunks-total",
		"uploader-original-name",
		"uploader-file-id",
	]

	for (const header of requiredHeaders) {
		if (!headers[header] || typeof headers[header] !== "string") {
			return false
		}

		if (
			(header === "uploader-chunk-number" ||
				header === "uploader-chunks-total") &&
			!/^[0-9]+$/.test(headers[header])
		) {
			return false
		}
	}

	return true
}

export function createAssembleChunksPromise({
	chunksPath,
	filePath,
	maxFileSize,
}) {
	return () =>
		new Promise(async (resolve, reject) => {
			let fileSize = 0

			if (!fs.existsSync(chunksPath)) {
				return reject(new OperationError(500, "No chunks found"))
			}

			let chunks = await fs.promises.readdir(chunksPath)

			if (chunks.length === 0) {
				return reject(new OperationError(500, "No chunks found"))
			}

			// Ordenar los chunks numéricamente
			chunks = chunks.sort((a, b) => {
				const aNum = parseInt(a, 10)
				const bNum = parseInt(b, 10)

				return aNum - bNum
			})

			for (const chunk of chunks) {
				const chunkPath = path.join(chunksPath, chunk)

				if (!fs.existsSync(chunkPath)) {
					return reject(
						new OperationError(500, "No chunk data found"),
					)
				}

				const data = await fs.promises.readFile(chunkPath)
				fileSize += data.length

				if (fileSize > maxFileSize) {
					return reject(
						new OperationError(
							413,
							"File exceeds max total file size, aborting assembly...",
						),
					)
				}

				await fs.promises.appendFile(filePath, data)
			}

			return resolve({
				chunksLength: chunks.length,
				filePath: filePath,
			})
		})
}

export async function handleChunkFile(
	fileStream,
	{ chunksPath, outputDir, headers, maxFileSize, maxChunkSize },
) {
	return await new Promise(async (resolve, reject) => {
		const chunkPath = path.join(
			chunksPath,
			headers["uploader-chunk-number"],
		)

		const chunkCount = +headers["uploader-chunk-number"]
		const totalChunks = +headers["uploader-chunks-total"]

		// check if file has all chunks uploaded
		const isLast = chunkCount === totalChunks - 1

		// make sure chunk is in range
		if (chunkCount < 0 || chunkCount >= totalChunks) {
			return reject(new OperationError(500, "Chunk is out of range"))
		}

		let dataWritten = 0

		let writeStream = fs.createWriteStream(chunkPath)

		writeStream.on("error", (err) => {
			reject(err)
		})

		writeStream.on("close", () => {
			if (maxChunkSize !== undefined) {
				if (dataWritten > maxChunkSize) {
					reject(
						new OperationError(
							413,
							"Chunk size exceeds max chunk size, aborting upload...",
						),
					)
					return
				}

				// estimate total file size,
				// if estimation exceeds maxFileSize, abort upload
				if (chunkCount === 0 && totalChunks > 0) {
					if (dataWritten * (totalChunks - 1) > maxFileSize) {
						reject(
							new OperationError(
								413,
								"File estimated size exceeds max total file size, aborting upload...",
							),
						)
						return
					}
				}
			}

			if (isLast) {
				// const mimetype = mimetypes.lookup(
				// 	headers["uploader-original-name"],
				// )
				// const extension = mimetypes.extension(mimetype)

				let filename = nanoid()

				return resolve(
					createAssembleChunksPromise({
						// build data
						chunksPath: chunksPath,
						filePath: path.resolve(outputDir, filename),
						maxFileSize: maxFileSize,
					}),
				)
			}

			return resolve(null)
		})

		fileStream.on("data", (buffer) => {
			dataWritten += buffer.byteLength
		})

		fileStream.pipe(writeStream)
	})
}
