import fs from "node:fs"

import Upload from "@shared-classes/Upload"

export default {
	id: "file-process",
	maxJobs: 2,
	process: async (job) => {
		console.log("[JOB][file-process] running... >", job.data)

		try {
			const result = await Upload.fileHandle({
				...job.data,
				onProgress: (progress) => {
					job.updateProgress(progress)
				},
			})

			return result
		} catch (error) {
			await fs.promises
				.rm(job.workPath, { recursive: true, force: true })
				.catch(() => null)

			console.error(error)

			throw new Error(
				`Failed to process file > ${error.message ?? error}`,
			)
		}
	},
}
