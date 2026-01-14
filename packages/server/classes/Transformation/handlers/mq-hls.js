import path from "node:path"
import MultiqualityHLSJob from "@shared-classes/MultiqualityHLSJob"

export default async ({ filePath, workPath, onProgress, capabilities }) => {
	return new Promise((resolve, reject) => {
		const outputDir = path.resolve(workPath, "mqhls")

		const levels = [
			{
				original: true,
				codec: "libx264",
				preset: "ultrafast",
				crf: 19,
				maxrate: "15M",
			},
			{
				codec: "libx264",
				width: "trunc(iw/2/2)*2",
				preset: "ultrafast",
				crf: 25,
				maxrate: "3M",
			},
		]

		if (capabilities.encoders.includes("h264_nvenc")) {
			levels[0] = {
				...levels[0],
				codec: "h264_nvenc",
				preset: "p4",
			}

			levels[1] = {
				...levels[1],
				codec: "h264_nvenc",
				preset: "p4",
			}
		}

		if (capabilities.encoders.includes("h264_vaapi")) {
			levels[0] = {
				...levels[0],
				codec: "h264_vaapi",
				preset: "medium",
			}

			levels[1] = {
				...levels[1],
				codec: "h264_vaapi",
				preset: "medium",
			}
		}

		if (capabilities.encoders.includes("h265_nvenc")) {
			levels[0] = {
				...levels[0],
				codec: "h265_nvenc",
				preset: "p4",
			}

			levels[1] = {
				...levels[1],
				codec: "h265_nvenc",
				preset: "p4",
			}
		}

		if (capabilities.encoders.includes("h265_vaapi")) {
			levels[0] = {
				...levels[0],
				codec: "hevc_vaapi",
				preset: "medium",
			}

			levels[1] = {
				...levels[1],
				codec: "hevc_vaapi",
				preset: "medium",
			}
		}

		const job = new MultiqualityHLSJob({
			input: filePath,
			outputDir: outputDir,
			outputMasterName: "master.m3u8",
			levels: levels,
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
