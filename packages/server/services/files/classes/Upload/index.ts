import fs from "node:fs"
import path from "node:path"

import mimeTypes from "mime-types"
import {fileTypeFromBuffer} from 'file-type'
import readChunk from "@utils/readChunk"

import getFileHash from "@shared-utils/readFileHash"
import putObject from "./putObject"

import Transformation, { TransformationPayloadType } from "../Transformation"

export type FileHandlePayload = {
	user_id: string
	filePath: string
	workPath: string
	uploadId?: string
	transformations?: Array<string>
	s3Provider?: string
	onProgress?: Function
}

export type S3UploadPayload = {
	filePath: string
	basePath: string
	targePath?: string
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
			basePath: payload.user_id,
		})

		// delete workpath
		await fs.promises.rm(payload.workPath, { recursive: true, force: true })

		return result
	}

	static process = async (payload: FileHandlePayload) => {
		if (Array.isArray(payload.transformations)) {
			for await (const transformation: TransformationPayloadType of payload.transformations) {
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
					payload.isDirectory = true
				}
			}
		}

		return payload
	}

	static toS3 = async (payload: S3UploadPayload, onProgress?: Function) => {
		const { filePath, basePath, targetPath } = payload

		const firstBuffer = await readChunk(targetPath ?? filePath, { length: 4100 })
		const fileHash = await getFileHash(fs.createReadStream(targetPath ?? filePath))
		const fileType = await fileTypeFromBuffer(firstBuffer)

		const uploadPath = path.join(basePath, path.basename(filePath))

		const metadata = {
			"File-Hash": fileHash,
			"Content-Type": fileType.mime,
		}

		if (typeof onProgress === "function") {
			onProgress({
				percent: 0,
				state: "uploading_s3",
			})
		}

		const result = await putObject({
			filePath: filePath,
			uploadPath: uploadPath,
			metadata: metadata,
			targetFilename: targetPath ? path.basename(targetPath) : null,
		})

		return result
	}
}
