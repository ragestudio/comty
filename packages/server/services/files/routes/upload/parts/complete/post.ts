import type { API } from "@services/files/files.service"

import path from "node:path"

export default defineRoute<API>()({
	useContexts: [
		"multipartUpload",
		"tasker",
		"capabilities",
		"cache",
	] as const,
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res, ctx) => {
		// @ts-ignore
		const user_id = req.auth.session.user_id
		const { task_id, file_hash, upload_id, object_path, parts } = req.body

		if (!task_id) {
			throw new OperationError(400, "Missing task_id")
		}

		const result = await ctx.multipartUpload.complete({
			user_id: user_id,
			file_hash: file_hash,
			upload_id: upload_id,
			object_path: object_path,
			parts: parts,
		})

		if (req.headers["transformations"]) {
			const workPath = path.resolve(
				ctx.cache.path,
				`${user_id}-${upload_id}`,
			)

			const transKeys = req.headers["transformations"]
				.split(",")
				.map((t) => t.trim())

			if (transKeys && transKeys.length > 0) {
				const job = await ctx.tasker.createJob("transformations", {
					user_id: user_id,
					taskId: task_id,
					workPath: workPath,

					fileHash: file_hash,
					filePath: result.url,
					objectPath: object_path,

					transformations: transKeys,
					capabilities: ctx.capabilities,
					useWebsocketEvents: true,
				})

				return {
					uploadId: upload_id,
					jobId: job.id,
					useWebsocketEvents: true,
				}
			}
		}

		return result
	},
})
