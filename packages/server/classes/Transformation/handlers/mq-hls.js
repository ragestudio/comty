import path from "node:path"
import MultiqualityHLSJob from "@shared-classes/MultiqualityHLSJob"

export default async ({ filePath, workPath, onProgress }) => {
	return new Promise((resolve, reject) => {
		const outputDir = path.resolve(workPath, "mqhls")

		const job = new MultiqualityHLSJob({
			input: filePath,
			outputDir: outputDir,

			// set default
			outputMasterName: "master.m3u8",
			levels: [
				{
					original: true,
					codec: "libx264",
					bitrate: "10M",
					preset: "ultrafast",
				},
				{
					codec: "libx264",
					width: 1280,
					bitrate: "3M",
					preset: "ultrafast",
				},
			],
		})

		job.on("end", (data) => {
			resolve(data)
		})

		job.on("progress", (progress) => {
			if (typeof onProgress === "function") {
				onProgress({
					percent: progress,
					state: "transmuxing",
				})
			}
		})

		job.on("error", (error) => {
			reject(error)
		})

		job.run()
	})
}
