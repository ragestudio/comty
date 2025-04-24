import fs from "node:fs"
import path from "node:path"
import { fileTypeFromBuffer } from "file-type"

import readChunk from "@shared-utils/readChunk"
import getFileHash from "@shared-utils/readFileHash"

import putObject from "./putObject"
import Transformation from "../Transformation"

export type FileHandlePayload = {
	user_id: string
	filePath: string
	workPath: string
	targetPath?: string // mostly provided by processed results
	//uploadId?: string
	transformations?: Array<string>
	s3Provider?: string
	onProgress?: Function
}

export type S3UploadPayload = {
	filePath: string
	basePath: string
	targetPath?: string
	onProgress?: Function
}

export default class Upload {
	static fileHandle = async (payload: FileHandlePayload) => {
		// process
		const processed = await Upload.process(payload)

		// overwrite filePath
		payload.filePath = processed.filePath

		// upload
		const result = await Upload.toS3({
			filePath: payload.filePath,
			targetPath: payload.targetPath,
			basePath: `${payload.user_id}/${global.nanoid()}`,
			onProgress: payload.onProgress,
		})

		// delete workpath
		await fs.promises.rm(payload.workPath, { recursive: true, force: true })

		return result
	}

	static process = async (payload: FileHandlePayload) => {
		if (Array.isArray(payload.transformations)) {
			for await (const transformation of payload.transformations) {
				const transformationResult = await Transformation.transform({
					filePath: payload.filePath,
					workPath: payload.workPath,
					onProgress: payload.onProgress,
					handler: transformation,
				})

				// if is a file, overwrite filePath
				if (transformationResult.outputFile) {
					payload.filePath = transformationResult.outputFile
				}

				// if is a directory, overwrite filePath to upload entire directory
				if (transformationResult.outputPath) {
					payload.filePath = transformationResult.outputPath
					payload.targetPath = transformationResult.outputFile
					//payload.isDirectory = true
				}
			}
		}

		return payload
	}

	static toS3 = async (payload: S3UploadPayload) => {
		const { filePath, basePath, targetPath, onProgress } = payload

		// if targetPath is provided, means its a directory
		const isDirectory = targetPath !== undefined

		let uploadPath = path.resolve(basePath, path.basename(filePath))

		if (isDirectory) {
			uploadPath = basePath
		}

		const metadata = await this.buildFileMetadata(
			isDirectory ? targetPath : filePath,
		)

		if (typeof onProgress === "function") {
			onProgress({
				percent: 0,
				state: "uploading_s3",
			})
		}

		console.log("Uploading to S3:", {
			filePath,
			uploadPath,
			basePath,
			targetPath,
			metadata,
		})

		const result = await putObject({
			filePath: filePath,
			uploadPath: uploadPath,
			metadata: metadata,
			targetFilename: isDirectory ? path.basename(targetPath) : null,
		})

		return result
	}

	static async buildFileMetadata(filePath: string) {
		const firstBuffer = await readChunk(filePath, {
			length: 4100,
		})
		const fileHash = await getFileHash(fs.createReadStream(filePath))
		const fileType = await fileTypeFromBuffer(firstBuffer)

		const metadata = {
			"File-Hash": fileHash,
			"Content-Type": fileType?.mime ?? "application/octet-stream",
		}

		return metadata
	}
}
