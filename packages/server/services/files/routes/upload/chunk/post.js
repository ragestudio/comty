import path from "node:path"
import fs from "node:fs"

import { checkChunkUploadHeaders, handleChunkFile } from "@classes/ChunkFile"
import Upload from "@shared-classes/Upload"
import bufferToStream from "@shared-utils/bufferToStream"

const availableProviders = ["b2", "standard"]

export default {
	useContext: ["cache", "limits"],
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		if (!checkChunkUploadHeaders(req.headers)) {
			throw new OperationError(400, "Missing header(s)")
		}

		const uploadId = `${req.headers["uploader-file-id"]}`

		const workPath = path.resolve(
			this.default.contexts.cache.constructor.cachePath,
			`${req.auth.session.user_id}-${uploadId}`,
		)
		const chunksPath = path.join(workPath, "chunks")
		const assembledPath = path.join(workPath, "assembled")

		const config = {
			maxFileSize:
				parseInt(this.default.contexts.limits.maxFileSizeInMB) *
				1024 *
				1024,
			maxChunkSize:
				parseInt(this.default.contexts.limits.maxChunkSizeInMB) *
				1024 *
				1024,
			useCompression: true,
			useProvider: req.headers["use-provider"] ?? "standard",
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
				assemble = await assemble()

				let transformations = req.headers["transformations"]

				if (transformations) {
					transformations = transformations
						.split(",")
						.map((t) => t.trim())
				}

				const payload = {
					user_id: req.auth.session.user_id,
					uploadId: uploadId,
					filePath: assemble.filePath,
					workPath: workPath,
					transformations: transformations,
					s3Provider: config.useProvider,
					useCompression: config.useCompression,
				}

				// if has transformations, use background job
				if (
					(transformations && transformations.length > 0) ||
					(config.useCompression && !req.headers["prefer-no-job"])
				) {
					const job = await global.queues.createJob(
						"file-process",
						payload,
						{
							useSSE: true,
						},
					)

					return {
						uploadId: payload.uploadId,
						sseChannelId: job.sseChannelId,
						sseUrl: `${req.headers["x-forwarded-proto"] || req.protocol}://${req.get("x-forwarded-host") ?? req.get("host")}/upload/sse_events/${job.sseChannelId}`,
					}
				}

				return await Upload.fileHandle(payload)
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
}
