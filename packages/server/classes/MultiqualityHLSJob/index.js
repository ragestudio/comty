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
		const cmdStr = [
			`-v error -hide_banner -progress pipe:1`,
			`-i ${this.params.input}`,
			`-filter_complex`,
		]

		// set split args
		let splitLevels = [`[0:v]split=${this.params.levels.length}`]

		this.params.levels.forEach((level, i) => {
			splitLevels[0] += `[v${i + 1}]`
		})

		for (const [index, level] of this.params.levels.entries()) {
			if (level.original) {
				splitLevels.push(`[v1]copy[v1out]`)
				continue
			}

			let scaleFilter = `[v${index + 1}]scale=w=${level.width}:h=trunc(ow/a/2)*2[v${index + 1}out]`

			splitLevels.push(scaleFilter)
		}

		cmdStr.push(`"${splitLevels.join(";")}"`)

		// set levels map
		for (const [index, level] of this.params.levels.entries()) {
			let mapArgs = [
				`-map "[v${index + 1}out]"`,
				`-x264-params "nal-hrd=cbr:force-cfr=1"`,
				`-c:v:${index} ${level.codec}`,
				`-b:v:${index} ${level.bitrate}`,
				`-maxrate:v:${index} ${level.bitrate}`,
				`-minrate:v:${index} ${level.bitrate}`,
				`-bufsize:v:${index} ${level.bitrate}`,
				`-preset ${level.preset}`,
				`-g 48`,
				`-sc_threshold 0`,
				`-keyint_min 48`,
			]

			cmdStr.push(...mapArgs)
		}

		// set output
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

		const inputProbe = await Utils.probe(this.params.input)

		try {
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
