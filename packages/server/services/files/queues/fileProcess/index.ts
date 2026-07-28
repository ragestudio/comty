import type { Job } from "bullmq"
import type { S3Manager } from "@shared-classes/StorageClient"

import fs from "node:fs"
import Upload from "@shared-classes/Upload"

export default {
	id: "file-process",
	//maxJobs: 2,
	process: async (job: Job) => {
		console.log("[JOB][file-process] running... >", job.data)
		const s3manager = global.storages as S3Manager

		try {
			// check if workPath exists, if not create it
			if (!fs.existsSync(job.data.workPath)) {
				await fs.promises.mkdir(job.data.workPath, { recursive: true })
			}

			return await Upload.fileHandle(
				{
					...job.data,
					onProgress: (progress) => job.updateProgress(progress),
				},
				s3manager,
			)
		} catch (error) {
			console.error(error)

			throw new Error(
				`Failed to process file > ${error.message ?? error}`,
			)
		} finally {
			// cleanup workPath
			await fs.promises
				.rm(job.data.workPath, { recursive: true, force: true })
				.catch(() => null)
		}
	},
}
