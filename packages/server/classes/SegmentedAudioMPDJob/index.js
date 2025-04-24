import fs from "node:fs"
import path from "node:path"

import { FFMPEGLib, Utils } from "../FFMPEGLib"

export default class SegmentedAudioMPDJob extends FFMPEGLib {
	constructor(params = {}) {
		super()

		this.params = {
			outputMasterName: "master.mpd",
			audioCodec: "libopus",
			audioBitrate: "320k",
			audioSampleRate: "48000",
			segmentTime: 10,
			includeMetadata: true,
			...params,
		}
	}

	buildSegmentationArgs = () => {
		const args = [
			//`-threads 1`, // limits to one thread
			`-v error -hide_banner -progress pipe:1`,
			`-i ${this.params.input}`,
			`-c:a ${this.params.audioCodec}`,
			`-map 0:a`,
			`-f dash`,
			`-dash_segment_type mp4`,
			`-segment_time ${this.params.segmentTime}`,
			`-use_template 1`,
			`-use_timeline 1`,
			`-init_seg_name "init.m4s"`,
		]

		if (this.params.includeMetadata === false) {
			args.push(`-map_metadata -1`)
		}

		if (
			typeof this.params.audioBitrate === "string" &&
			this.params.audioBitrate !== "default"
		) {
			args.push(`-b:a ${this.params.audioBitrate}`)
		}

		if (
			typeof this.params.audioSampleRate !== "undefined" &&
			this.params.audioSampleRate !== "default"
		) {
			args.push(`-ar ${this.params.audioSampleRate}`)
		}

		args.push(this.params.outputMasterName)

		return args
	}

	run = async () => {
		const segmentationCmd = this.buildSegmentationArgs()
		const outputPath =
			this.params.outputDir ?? `${path.dirname(this.params.input)}/dash`
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
				args: segmentationCmd,
				onProcess: (process) => {
					this.handleProgress(
						process.stdout,
						parseFloat(inputProbe.format.duration),
						(progress) => {
							this.emit("progress", progress)
						},
					)
				},
				cwd: outputPath,
			})

			let outputProbe = await Utils.probe(outputFile)

			this.emit("end", {
				probe: {
					input: inputProbe,
					output: outputProbe,
				},
				outputPath: outputPath,
				outputFile: outputFile,
			})

			return result
		} catch (err) {
			return this.emit("error", err)
		}
	}
}
