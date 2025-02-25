import path from "path"
import fs from "fs"
import RemoteUpload from "@services/remoteUpload"

import ChunkFileUpload from "@shared-classes/ChunkFileUpload"

const availableProviders = ["b2", "standard"]

export default {
	useContext: ["cache", "limits"],
	middlewares: ["withAuthentication"],
	fn: async (req, res) => {
		const uploadId = `${req.headers["uploader-file-id"]}_${Date.now()}`

		const tmpPath = path.resolve(
			this.default.contexts.cache.constructor.cachePath,
			req.auth.session.user_id,
		)

		const limits = {
			maxFileSize:
				parseInt(this.default.contexts.limits.maxFileSizeInMB) *
				1024 *
				1024,
			maxChunkSize:
				parseInt(this.default.contexts.limits.maxChunkSizeInMB) *
				1024 *
				1024,
			useCompression: true,
			useProvider: "standard",
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
		if (!availableProviders.includes(limits.useProvider)) {
			throw new OperationError(400, "Invalid provider")
		}

		let build = await ChunkFileUpload(req, {
			tmpDir: tmpPath,
			...limits,
		}).catch((err) => {
			throw new OperationError(err.code, err.message)
		})

		if (typeof build === "function") {
			try {
				build = await build()

				if (req.headers["transmux"] || limits.useCompression === true) {
					// add a background task
					const job = await global.queues.createJob(
						"remote_upload",
						{
							filePath: build.filePath,
							parentDir: req.auth.session.user_id,
							service: limits.useProvider,
							useCompression: limits.useCompression,
							transmux: req.headers["transmux"] ?? false,
							transmuxOptions: req.headers["transmux-options"],
							cachePath: tmpPath,
						},
						{
							useSSE: true,
						},
					)

					const sseChannelId = job.sseChannelId

					return {
						uploadId: uploadId,
						sseChannelId: sseChannelId,
						eventChannelURL: `https://${req.get("host")}/upload/sse_events/${sseChannelId}`,
					}
				} else {
					const result = await RemoteUpload({
						source: build.filePath,
						parentDir: req.auth.session.user_id,
						service: limits.useProvider,
						useCompression: limits.useCompression,
						cachePath: tmpPath,
					})

					return result
				}
			} catch (error) {
				await fs.promises
					.rm(tmpPath, { recursive: true, force: true })
					.catch(() => {
						return false
					})

				throw new OperationError(
					error.code ?? 500,
					error.message ?? "Failed to upload file",
				)
			}
		}

		return {
			ok: 1,
			chunkNumber: req.headers["uploader-chunk-number"],
		}
	},
}
