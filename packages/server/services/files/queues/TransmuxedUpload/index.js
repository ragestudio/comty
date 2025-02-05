import path from "node:path"

import fs from "node:fs"
import RemoteUpload from "@services/remoteUpload"

export default {
	id: "remote_upload",
	maxJobs: 10,
	process: async (job) => {
		const {
			filePath,
			parentDir,
			service,
			useCompression,
			cachePath,
			transmux,
			transmuxOptions,
		} = job.data

		console.log("[JOB][remote_upload] Processing job >", job.data)

		try {
			const result = await RemoteUpload({
				parentDir: parentDir,
				source: filePath,
				service: service,
				useCompression: useCompression,
				transmux: transmux,
				transmuxOptions: transmuxOptions,
				cachePath: cachePath,
				onProgress: (progress) => {
					job.progress(progress)
				},
			})

			await fs.promises
				.rm(filePath, { recursive: true, force: true })
				.catch(() => null)

			return result
		} catch (error) {
			await fs.promises
				.rm(filePath, { recursive: true, force: true })
				.catch(() => null)

			throw error
		}
	},
}
