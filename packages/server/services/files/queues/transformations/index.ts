import type { Job } from "bullmq"
import type { S3Manager } from "@shared-classes/StorageClient"

import fs from "node:fs"
import path from "node:path"
import Transformation from "@shared-classes/Transformation"
import putObject from "@shared-classes/Upload/putObject"

export default {
	id: "transformations",
	//maxJobs: 2,
	process: async (job: Job) => {
		if (!Array.isArray(job?.data?.transformations)) {
			return null
		}
		if (!job.data.prevResult) {
			return null
		}

		const s3manager = global.storages as S3Manager
		console.log("[JOB][transformations] running... >", job.data)

		try {
			// check if workPath exists, if not create it
			if (!fs.existsSync(job.data.workPath)) {
				await fs.promises.mkdir(job.data.workPath, { recursive: true })
			}

			let transformationResult = null

			// itterate over transformations and apply them one by one
			for (const tkey of job.data.transformations) {
				transformationResult = await Transformation.transform({
					handler: tkey,
					filePath: job.data.filePath,
					workPath: job.data.workPath,
					capabilities: job.data.capabilities,
					onProgress: (progress) => job.updateProgress(progress),
				})
			}

			// if transformationResult is null, return null
			if (!transformationResult) {
				return job.data.prevResult
			}

			console.log(
				"[JOB][transformations] done, uploading to s3 source >",
				{
					data: job.data,
					transformationResult: transformationResult,
				},
			)

			const ffMetadata: Record<string, string> = {
				...(job.data.prevResult.metadata ?? {}),
				...(transformationResult.metadata ?? {}),
			}

			// put the final proccesed object
			const uploadResult = await putObject({
				filePath:
					transformationResult.outputPath ??
					transformationResult.outputFile,
				targetFilename: path.basename(transformationResult.outputFile),
				uploadPath: `${job.data.objectPath}-processed`,

				onFinish: () => {},
				onProgress: (progress) => job.updateProgress(progress),

				metadata: ffMetadata,
				providerClass: s3manager.getDefaultService(),
			})

			return {
				...job.data.prevResult,
				...uploadResult,
			}
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
