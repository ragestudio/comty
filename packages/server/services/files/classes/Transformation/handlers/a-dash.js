import path from "node:path"
import SegmentedAudioMPDJob from "@shared-classes/SegmentedAudioMPDJob"

export default async ({ filePath, workPath, onProgress }) => {
	return new Promise(async (resolve, reject) => {
		const outputDir = path.resolve(workPath, "a-dash")

		const job = new SegmentedAudioMPDJob({
			input: filePath,
			outputDir: outputDir,

			// set to default as raw flac
			audioCodec: "flac",
			audioBitrate: "default",
			audioSampleRate: "default",
		})

		job.on("start", () => {
			console.log("A-DASH started")
		})

		job.on("end", (data) => {
			console.log("A-DASH completed", data)
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

		job.run()
	})
}
