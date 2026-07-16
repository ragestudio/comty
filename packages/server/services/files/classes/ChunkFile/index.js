// Orginal forked from: Buzut/huge-uploader-nodejs
// Copyright (c) 2018, Quentin Busuttil All rights reserved.

import fs from "node:fs"
import fsPromises from "node:fs/promises"
import path from "node:path"
import { XXHash64 } from "xxhash-addon"

export function checkTotalSize(chunkSize, totalChunks, maxFileSize) {
	return chunkSize * totalChunks < maxFileSize
}

export function checkChunkUploadHeaders(headers) {
	const requiredHeaders = [
		"uploader-chunk-number",
		"uploader-chunks-total",
		"uploader-original-name",
		"uploader-file-id",
	]

	for (const header of requiredHeaders) {
		const val = headers[header]

		if (!val || typeof val !== "string") {
			return false
		}

		if (
			header === "uploader-chunk-number" ||
			header === "uploader-chunks-total"
		) {
			if (!/^\d+$/.test(val)) return false
		}
	}

	return true
}

export async function computeFileHash(filePath) {
	const hasher = new XXHash64(Buffer.alloc(4))
	const stream = fs.createReadStream(filePath)

	for await (const chunk of stream) {
		hasher.update(chunk)
	}

	return hasher.digest().toString("hex")
}

export function createAssembleChunksPromise({
	chunksPath,
	filePath,
	maxFileSize,
	originalFileHash,
}) {
	return async () => {
		let chunks

		try {
			chunks = await fsPromises.readdir(chunksPath)
		} catch (err) {
			throw new OperationError(500, "No chunks found or folder missing")
		}

		if (chunks.length === 0) {
			throw new OperationError(500, "No chunks found")
		}

		chunks.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

		let fileSize = 0
		const writeStream = fs.createWriteStream(filePath)

		try {
			for (const chunk of chunks) {
				const chunkPath = path.join(chunksPath, chunk)

				const stat = await fsPromises.stat(chunkPath).catch(() => null)

				if (!stat) {
					throw new OperationError(500, "Failed to read chunk data")
				}

				fileSize += stat.size

				if (fileSize > maxFileSize) {
					throw new OperationError(
						413,
						"File exceeds max total file size, aborting assembly...",
					)
				}

				await new Promise((resolve, reject) => {
					const readStream = fs.createReadStream(chunkPath)

					readStream.pipe(writeStream, { end: false })
					readStream.on("end", resolve)
					readStream.on("error", reject)
				})
			}
		} finally {
			writeStream.end()
			await new Promise((resolve) => writeStream.on("finish", resolve))
		}

		const fileHash = await computeFileHash(filePath)

		if (
			typeof originalFileHash === "string" &&
			originalFileHash !== fileHash
		) {
			throw new OperationError(
				400,
				`Invalid file hash check, hashes dont match\n original: [${originalFileHash}] received: [${fileHash}]`,
			)
		}

		// clear assembled chunks
		await fsPromises
			.rm(chunksPath, { recursive: true, force: true })
			.catch(() => {})

		return {
			filePath,
			fileHash,
			chunksLength: chunks.length,
		}
	}
}

export async function handleChunkFile(
	fileStream,
	{ chunksPath, outputDir, headers, maxFileSize, maxChunkSize },
) {
	const chunkCount = parseInt(headers["uploader-chunk-number"], 10)
	const totalChunks = parseInt(headers["uploader-chunks-total"], 10)
	const chunkPath = path.join(chunksPath, chunkCount.toString())

	const isLast = chunkCount === totalChunks - 1

	if (chunkCount < 0 || chunkCount >= totalChunks) {
		throw new OperationError(500, "Chunk is out of range")
	}

	await fsPromises.mkdir(chunksPath, { recursive: true })
	const writeStream = fs.createWriteStream(chunkPath)

	let dataWritten = 0

	try {
		for await (const chunk of fileStream) {
			dataWritten += chunk.byteLength

			if (maxChunkSize !== undefined && dataWritten > maxChunkSize) {
				throw new OperationError(
					413,
					"Chunk size exceeds max chunk size, aborting upload...",
				)
			}

			if (!writeStream.write(chunk)) {
				await new Promise((resolve) =>
					writeStream.once("drain", resolve),
				)
			}
		}

		writeStream.end()
		await new Promise((resolve) => writeStream.once("finish", resolve))
	} catch (error) {
		writeStream.destroy()

		await fsPromises.rm(chunkPath, { force: true }).catch(() => {})
		throw error
	}

	if (chunkCount === 0 && totalChunks > 0 && maxChunkSize !== undefined) {
		if (dataWritten * (totalChunks - 1) > maxFileSize) {
			await fsPromises.rm(chunkPath, { force: true }).catch(() => {})

			throw new OperationError(
				413,
				"File estimated size exceeds max total file size, aborting upload...",
			)
		}
	}

	if (isLast) {
		return createAssembleChunksPromise({
			chunksPath,
			filePath: path.resolve(outputDir, nanoid()),
			maxFileSize,
			originalFileHash: headers?.["uploader-file-hash"],
		})
	}

	return null
}
