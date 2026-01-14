import fs from "node:fs"
import path from "node:path"

import { FFMPEGLib, Utils } from "../FFMPEGLib"

export default class MultiqualityHLSJob extends FFMPEGLib {
	constructor(params = {}) {
		super()

		this.params = {
			outputMasterName: "master.m3u8",
			levels: [
				{
					original: true,
					codec: "libx264",
					bitrate: "10M",
					preset: "ultrafast",
				},
			],
			...params,
		}
	}

	buildArgs = () => {
		const useVaapi = this.params.levels.some((level) =>
			level.codec.includes("vaapi"),
		)

		const cmdStr = [`-v error -hide_banner -progress pipe:1`]

		if (useVaapi) {
			const devicePath = this.params.vaapiDevice || "/dev/dri/renderD128"
			cmdStr.push(`-init_hw_device vaapi=va:${devicePath}`)
			cmdStr.push(`-filter_hw_device va`)
		}

		cmdStr.push(`-i ${this.params.input}`)
		cmdStr.push(`-filter_complex`)

		let splitLevels = [`[0:v]split=${this.params.levels.length}`]

		this.params.levels.forEach((_, i) => {
			splitLevels[0] += `[v${i + 1}]`
		})

		for (const [index, level] of this.params.levels.entries()) {
			const isVaapi = level.codec.includes("vaapi")
			let filters = []

			let widthExpr = "iw"

			if (level.width) {
				widthExpr = level.width
			} else if (level.scaleFactor) {
				widthExpr = `trunc(iw*${level.scaleFactor}/2)*2`
			}

			if (level.original && !level.width && !level.scaleFactor) {
				filters.push(`null`)
			} else {
				filters.push(`scale=w=${widthExpr}:h=trunc(ow/a/2)*2`)
			}

			if (isVaapi) {
				filters.push(`format=nv12,hwupload`)
			}

			let filterChain = `[v${index + 1}]${filters.join(",")}[v${index + 1}out]`
			splitLevels.push(filterChain)
		}

		cmdStr.push(`"${splitLevels.join(";")}"`)

		for (const [index, level] of this.params.levels.entries()) {
			const isLibx264 = level.codec === "libx264"
			const isNvenc = level.codec.includes("nvenc")
			const isVaapi = level.codec.includes("vaapi")

			let mapArgs = [`-map "[v${index + 1}out]"`]

			mapArgs.push(`-c:v:${index} ${level.codec}`)

			if (level.crf) {
				const maxRate = level.maxrate || level.bitrate || "10M"

				mapArgs.push(`-maxrate:v:${index} ${maxRate}`)
				mapArgs.push(`-bufsize:v:${index} ${maxRate}`)

				if (isLibx264) {
					mapArgs.push(`-crf ${level.crf}`)
				} else if (isNvenc) {
					mapArgs.push(`-cq ${level.crf}`)
					mapArgs.push(`-rc vbr`)
					mapArgs.push(`-qmin ${Math.max(0, level.crf - 5)}`)
					mapArgs.push(`-qmax ${Math.min(51, level.crf + 5)}`)
				} else if (isVaapi) {
					mapArgs.push(`-global_quality ${level.crf}`)
					mapArgs.push(`-b:v:${index} ${maxRate}`)
				}
			} else {
				const bitrate = level.bitrate || "5M"

				mapArgs.push(`-b:v:${index} ${bitrate}`)
				mapArgs.push(`-maxrate:v:${index} ${bitrate}`)
				mapArgs.push(`-minrate:v:${index} ${bitrate}`)
				mapArgs.push(`-bufsize:v:${index} ${bitrate}`)

				if (isLibx264) {
					mapArgs.push(`-x264-params "nal-hrd=cbr:force-cfr=1"`)
				}
			}

			mapArgs.push(`-g 48`)
			mapArgs.push(`-sc_threshold 0`)
			mapArgs.push(`-keyint_min 48`)

			if (level.preset) {
				mapArgs.push(`-preset ${level.preset}`)
			} else if (isLibx264) {
				mapArgs.push(`-preset ultrafast`)
			}

			cmdStr.push(...mapArgs)
		}

		cmdStr.push(`-f hls`)
		cmdStr.push(`-hls_time 2`)
		cmdStr.push(`-hls_playlist_type vod`)
		cmdStr.push(`-hls_flags independent_segments`)
		cmdStr.push(`-hls_segment_type mpegts`)
		cmdStr.push(`-hls_segment_filename stream_%v/data%02d.ts`)
		cmdStr.push(`-master_pl_name ${this.params.outputMasterName}`)

		cmdStr.push(`-var_stream_map`)

		let streamMapVar = []

		for (const [index, level] of this.params.levels.entries()) {
			streamMapVar.push(`v:${index}`)
		}

		cmdStr.push(`"${streamMapVar.join(" ")}"`)
		cmdStr.push(`"stream_%v/stream.m3u8"`)

		return cmdStr.join(" ")
	}

	run = async () => {
		const cmdStr = this.buildArgs()

		const outputPath =
			this.params.outputDir ??
			path.join(path.dirname(this.params.input), "hls")
		const outputFile = path.join(outputPath, this.params.outputMasterName)

		this.emit("start", {
			input: this.params.input,
			output: outputPath,
			params: this.params,
		})

		if (!fs.existsSync(outputPath)) {
			fs.mkdirSync(outputPath, { recursive: true })
		}

		try {
			const inputProbe = await Utils.probe(this.params.input)

			console.debug("Transcoding video to MQ-HLS", {
				input: this.params.input,
				output: outputPath,
				args: cmdStr,
			})

			const result = await this.ffmpeg({
				args: cmdStr,
				cwd: outputPath,
				onProcess: (process) => {
					this.handleProgress(
						process.stdout,
						parseFloat(inputProbe.format.duration),
						(progress) => {
							this.emit("progress", progress)
						},
					)
				},
			})

			console.debug("Transcoding video to MQ-HLS finished", {
				input: this.params.input,
				output: outputPath,
			})

			this.emit("end", {
				outputPath: outputPath,
				outputFile: outputFile,
			})

			return result
		} catch (err) {
			return this.emit("error", err)
		}
	}
}
