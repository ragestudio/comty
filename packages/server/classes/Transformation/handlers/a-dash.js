import path from "node:path"
import SegmentedAudioMPDJob from "@shared-classes/SegmentedAudioMPDJob"

export default async ({ filePath, workPath, onProgress }) => {
	return new Promise((resolve, reject) => {
		const outputDir = path.resolve(workPath, "a-dash")

		const job = new SegmentedAudioMPDJob({
			input: filePath,
			outputDir: outputDir,

			// set to default as raw flac
			audioCodec: "copy",
			audioBitrate: "default",
			audioSampleRate: "default",
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
