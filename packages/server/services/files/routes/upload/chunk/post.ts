import type { API } from "@services/files/files.service"

import path from "node:path"
import fs from "node:fs"

import { checkChunkUploadHeaders, handleChunkFile } from "@classes/ChunkFile"
import Upload from "@shared-classes/Upload"
import bufferToStream from "@shared-utils/bufferToStream"

const availableProviders = ["ovh", "b2", "standard"]

export default defineRoute<API>()({
	useContexts: ["cache", "limits", "capabilities", "tasker", "s3"] as const,
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res, ctx) => {
		// @ts-ignore
		const user_id = req.auth.session.user_id

		if (!checkChunkUploadHeaders(req.headers)) {
			throw new OperationError(400, "Missing header(s)")
		}

		const uploadId = `${req.headers["uploader-file-id"]}`

		const workPath = path.resolve(ctx.cache.path, `${user_id}-${uploadId}`)
		const chunksPath = path.join(workPath, "chunks")
		const assembledPath = path.join(workPath, "assembled")

		const config = {
			maxFileSize: parseInt(ctx.limits.maxFileSizeInMB) * 1024 * 1024,
			maxChunkSize: parseInt(ctx.limits.maxChunkSizeInMB) * 1024 * 1024,
			useCompression: true,
			useProvider:
				req.headers["use-provider"] ??
				process.env["DEFAULT_S3_PROVIDER"] ??
				"standard",
		}

		// const user = await req.auth.user()
		// if (user.roles.includes("admin")) {
		// 	// maxFileSize for admins 100GB
		// 	limits.maxFileSize = 100 * 1024 * 1024 * 1024
		// 	// optional compression for admins
		// 	limits.useCompression = req.headers["use-compression"] ?? false
		// 	limits.useProvider = req.headers["provider-type"] ?? "b2"
		// }

		// check if provider is valid
		if (!availableProviders.includes(config.useProvider)) {
			throw new OperationError(400, "Invalid provider")
		}

		await fs.promises.mkdir(workPath, { recursive: true })
		await fs.promises.mkdir(chunksPath, { recursive: true })
		await fs.promises.mkdir(assembledPath, { recursive: true })

		// create a readable stream
		const dataStream = bufferToStream(await req.buffer())

		let assemble = await handleChunkFile(dataStream, {
			chunksPath: chunksPath,
			outputDir: assembledPath,
			headers: req.headers,
			maxFileSize: config.maxFileSize,
			maxChunkSize: config.maxChunkSize,
		})

		if (typeof assemble === "function") {
			try {
				const assembled = await assemble()

				let transformations: string[]

				if (req.headers["transformations"]) {
					transformations = req.headers["transformations"]
						.split(",")
						.map((t) => t.trim())
				}

				const payload = {
					filePath: assembled.filePath,
					fileHash: assembled.fileHash,

					user_id: user_id,
					uploadId: uploadId,
					workPath: workPath,

					originalFilename: req.headers["uploader-original-name"],
					transformations: transformations,
					s3Provider: config.useProvider,
					useCompression: config.useCompression,
					capabilities: ctx.capabilities,
					useWebsocketEvents: true,
				}

				// if has transformations, use background job
				if (
					(transformations && transformations.length > 0) ||
					(config.useCompression && !req.headers["prefer-no-job"])
				) {
					const job = await ctx.tasker.createJob(
						"file-process",
						payload,
					)

					return {
						uploadId: payload.uploadId,
						jobId: job.id,
						useWebsocketEvents: true,
					}
				}

				return await Upload.fileHandle(payload, ctx.s3)
			} catch (error) {
				await fs.promises.rm(workPath, { recursive: true })
				throw error
			}
		}

		return {
			next: true,
			chunkNumber: req.headers["uploader-chunk-number"],
			config: config,
		}
	},
})
