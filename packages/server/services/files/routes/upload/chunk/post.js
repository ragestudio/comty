import { Duplex } from "node:stream"
import path from "node:path"
import fs from "node:fs"
import RemoteUpload from "@services/remoteUpload"
import {
	checkChunkUploadHeaders,
	handleChunkFile,
} from "@classes/ChunkFileUpload"

const availableProviders = ["b2", "standard"]

function bufferToStream(bf) {
	let tmp = new Duplex()
	tmp.push(bf)
	tmp.push(null)
	return tmp
}

export default {
	useContext: ["cache", "limits"],
	middlewares: ["withAuthentication"],
	fn: async (req, res) => {
		if (!checkChunkUploadHeaders(req.headers)) {
			reject(new OperationError(400, "Missing header(s)"))
			return
		}

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

		// create a readable stream from req.body(buffer)
		const dataStream = bufferToStream(await req.buffer())

		let result = await handleChunkFile(dataStream, {
			tmpDir: tmpPath,
			headers: req.headers,
			maxFileSize: limits.maxFileSize,
			maxChunkSize: limits.maxChunkSize,
		})

		if (typeof result === "function") {
			try {
				result = await result()

				if (req.headers["transmux"] || limits.useCompression === true) {
					// add a background task
					const job = await global.queues.createJob(
						"remote_upload",
						{
							filePath: result.filePath,
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
						eventChannelURL: `${req.headers["x-forwarded-proto"] || req.protocol}://${req.get("host")}/upload/sse_events/${sseChannelId}`,
					}
				} else {
					const result = await RemoteUpload({
						source: result.filePath,
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
