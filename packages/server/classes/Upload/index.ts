// @ts-ignore
import fs from "node:fs"
// @ts-ignore
import path from "node:path"
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type"

import readChunk from "@shared-utils/readChunk"
import getFileHash from "@shared-utils/readFileHash"

import putObject from "./putObject"
import Transformation from "../Transformation"

export type FileHandlePayload = {
	filePath: string
	fileHash?: string

	user_id: string
	workPath: string
	targetPath?: string
	originalFilename?: string
	transformations?: Array<string>
	useCompression?: boolean
	s3Provider?: string
	onProgress?: Function
	capabilities?: {
		encoders: Array<string>
	}
}

export type S3UploadPayload = {
	filePath: string
	fileHash?: string

	basePath: string
	targetPath?: string
	s3Provider?: string
	onProgress?: Function
	originalFilename?: string
}

export type FileIntegrityResult = {
	isValid: boolean
	fileSize: number
	fileHash: string
	error?: string
}

export default class Upload {
	static fileHandle = async (payload: FileHandlePayload) => {
		const integrityCheck = await Upload.validateFileIntegrity(
			payload.filePath,
		)

		if (!integrityCheck.isValid) {
			throw new OperationError(
				400,
				`File integrity check failed: ${integrityCheck.error}`,
			)
		}

		if (!payload.transformations) {
			payload.transformations = []
		}

		if (
			payload.useCompression === true &&
			payload.transformations.length === 0
		) {
			payload.transformations.push("optimize")
		}

		if (payload.transformations.length > 0) {
			const processed = await Upload.transform(payload)
			payload.filePath = processed.filePath
		}

		const result = await Upload.toS3({
			filePath: payload.filePath,
			fileHash: payload.fileHash,

			targetPath: payload.targetPath,
			basePath: payload.user_id,
			onProgress: payload.onProgress,
			s3Provider: payload.s3Provider,
			originalFilename: payload.originalFilename,
		})

		await fs.promises.rm(payload.workPath, { recursive: true, force: true })

		return result
	}

	static transform = async (payload: FileHandlePayload) => {
		if (Array.isArray(payload.transformations)) {
			for await (const transformation of payload.transformations) {
				const transformationResult = await Transformation.transform({
					filePath: payload.filePath,
					workPath: payload.workPath,
					onProgress: payload.onProgress,
					handler: transformation,
					capabilities: payload.capabilities,
				})

				if (transformationResult.outputFile) {
					payload.filePath = transformationResult.outputFile
				}

				if (transformationResult.outputPath) {
					payload.filePath = transformationResult.outputPath
					payload.targetPath = transformationResult.outputFile
				}
			}
		}

		return payload
	}

	static toS3 = async (payload: S3UploadPayload) => {
		const {
			filePath,
			fileHash,

			basePath,
			targetPath,
			s3Provider,
			onProgress,
			originalFilename,
		} = payload

		const isDirectory = !!targetPath

		const metadata = await this.buildFileMetadata(
			isDirectory ? targetPath : filePath,
			fileHash,
		)

		let uploadPath = path.join(basePath, metadata["File-Hash"])

		if (isDirectory) {
			uploadPath = path.join(basePath, (global as any).nanoid())
		}

		if (originalFilename) {
			metadata["Filename"] = originalFilename
		}

		if (typeof onProgress === "function") {
			onProgress({
				percent: 0,
				state: "uploading_s3",
			})
		}

		metadata["x-amz-acl"] = "public-read"

		const result = await putObject({
			filePath: filePath,
			uploadPath: uploadPath,
			metadata: metadata,
			targetFilename: isDirectory ? path.basename(targetPath!) : null,
			provider: s3Provider,
			onProgress: onProgress,
			onFinish: () => {},
		})

		return result
	}

	static async buildFileMetadata(
		filePath: string,
		fileHash?: string,
	): Promise<{ [key: string]: string }> {
		// const firstBuffer = await readChunk(filePath, {
		// 	length: 4100,
		// })

		const fileType = await fileTypeFromFile(filePath)

		// if no hash provided, use the fallback computation
		if (!fileHash) {
			fileHash = await getFileHash(fs.createReadStream(filePath))
		}

		return {
			"Content-Type": fileType?.mime ?? "application/octet-stream",
			"File-Hash": fileHash,
		}
	}

	static async validateFileIntegrity(
		filePath: string,
	): Promise<FileIntegrityResult> {
		try {
			const stats = await fs.promises.stat(filePath)

			if (!stats.isFile()) {
				return {
					isValid: false,
					fileSize: 0,
					fileHash: "",
					error: "Path is not a file",
				}
			}

			if (stats.size === 0) {
				return {
					isValid: false,
					fileSize: 0,
					fileHash: "",
					error: "File is empty",
				}
			}

			const fileHash = await getFileHash(fs.createReadStream(filePath))

			if (!fileHash || fileHash.length === 0) {
				return {
					isValid: false,
					fileSize: stats.size,
					fileHash: "",
					error: "Failed to calculate file hash",
				}
			}

			const firstBuffer = await readChunk(filePath, {
				length: 512,
			})

			if (!firstBuffer || firstBuffer.length === 0) {
				return {
					isValid: false,
					fileSize: stats.size,
					fileHash: fileHash,
					error: "Failed to read file content",
				}
			}

			return {
				isValid: true,
				fileSize: stats.size,
				fileHash: fileHash,
			}
		} catch (error) {
			return {
				isValid: false,
				fileSize: 0,
				fileHash: "",
				error: `Integrity check error: ${error instanceof Error ? error.message : String(error)}`,
			}
		}
	}
}
