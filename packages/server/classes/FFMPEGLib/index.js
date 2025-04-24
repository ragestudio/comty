import { EventEmitter } from "node:events"
import child_process from "node:child_process"

function getBinaryPath(name) {
	try {
		return child_process
			.execSync(`which ${name}`, { encoding: "utf8" })
			.trim()
	} catch (error) {
		return null
	}
}

export class FFMPEGLib extends EventEmitter {
	constructor() {
		super()
		this.ffmpegBin = getBinaryPath("ffmpeg")
		this.ffprobeBin = getBinaryPath("ffprobe")
	}

	handleProgress(stdout, endTime, onProgress = () => {}) {
		let currentTime = 0

		stdout.on("data", (data) => {
			for (const line of data.toString().split("\n")) {
				if (line.startsWith("out_time_ms=")) {
					currentTime = parseInt(line.split("=")[1]) / 1000000
				} else if (line.startsWith("progress=")) {
					const status = line.split("=")[1]

					if (status === "end") {
						onProgress(100)
					} else if (endTime > 0 && currentTime > 0) {
						onProgress(
							Math.min(
								100,
								Math.round((currentTime / endTime) * 100),
							),
						)
					}
				}
			}
		})
	}

	ffmpeg(payload) {
		return this.exec(this.ffmpegBin, payload)
	}

	ffprobe(payload) {
		return this.exec(this.ffprobeBin, payload)
	}

	exec(bin, { args, onProcess, cwd }) {
		if (Array.isArray(args)) {
			args = args.join(" ")
		}

		return new Promise((resolve, reject) => {
			const process = child_process.exec(
				`${bin} ${args}`,
				{
					cwd: cwd,
				},
				(error, stdout, stderr) => {
					if (error) {
						reject(stderr)
					} else {
						resolve(stdout.toString())
					}
				},
			)

			if (typeof onProcess === "function") {
				onProcess(process)
			}
		})
	}
}

export class Utils {
	static async probe(input) {
		const lib = new FFMPEGLib()

		const result = await lib
			.ffprobe({
				args: [
					"-v",
					"error",
					"-print_format",
					"json",
					"-show_format",
					"-show_streams",
					input,
				],
			})
			.catch((err) => {
				console.log(err)
				return null
			})

		if (!result) {
			return null
		}

		return JSON.parse(result)
	}
}

export default FFMPEGLib
