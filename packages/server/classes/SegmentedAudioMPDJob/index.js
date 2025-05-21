import fs from "node:fs"
import path from "node:path"

import { FFMPEGLib, Utils } from "../FFMPEGLib"

const codecOverrides = {
	wav: "flac",
}

export default class SegmentedAudioMPDJob extends FFMPEGLib {
	constructor(params = {}) {
		super()

		this.params = {
			outputMasterName: "master.mpd",
			audioCodec: "libopus",
			audioBitrate: "320k",
			audioSampleRate: "48000",
			segmentTime: 10,
			minBufferTime: 5,
			includeMetadata: true,
			...params,
		}
	}

	buildSegmentationArgs = () => {
		const args = [
			`-v error -hide_banner -progress pipe:1`,
			`-i ${this.params.input}`,
			`-c:a ${this.params.audioCodec}`,
			`-map 0:a`,
			`-f dash`,
			`-segment_time ${this.params.segmentTime}`,
			`-use_template 1`,
			`-use_timeline 1`,
			//`-dash_segment_type mp4`,
			//`-init_seg_name "init.m4s"`,
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

	_updateMpdMinBufferTime = async (mpdPath, newMinBufferTimeSecs) => {
		try {
			const mpdTagRegex = /(<MPD[^>]*)/
			let mpdContent = await fs.promises.readFile(mpdPath, "utf-8")

			const minBufferTimeAttribute = `minBufferTime="PT${newMinBufferTimeSecs}.0S"`
			const existingMinBufferTimeRegex =
				/(<MPD[^>]*minBufferTime=")[^"]*(")/

			if (existingMinBufferTimeRegex.test(mpdContent)) {
				mpdContent = mpdContent.replace(
					existingMinBufferTimeRegex,
					`$1PT${newMinBufferTimeSecs}.0S$2`,
				)
				await fs.promises.writeFile(mpdPath, mpdContent, "utf-8")
			} else {
				if (mpdTagRegex.test(mpdContent)) {
					mpdContent = mpdContent.replace(
						mpdTagRegex,
						`$1 ${minBufferTimeAttribute}`,
					)

					await fs.promises.writeFile(mpdPath, mpdContent, "utf-8")
				}
			}
		} catch (error) {
			console.error(
				`[SegmentedAudioMPDJob] Error updating MPD minBufferTime for ${mpdPath}:`,
				error,
			)
		}
	}

	_updateMpdBandwidthAndSamplingRate = async ({
		mpdPath,
		bandwidth,
		samplingRate,
	} = {}) => {
		try {
			let mpdContent = await fs.promises.readFile(mpdPath, "utf-8")

			// Regex to find all <Representation ...> tags
			const representationRegex = /(<Representation\b[^>]*)(>)/g

			mpdContent = mpdContent.replace(
				representationRegex,
				(match, startTag, endTag) => {
					// Remove existing bandwidth and audioSamplingRate attributes if present
					let newTag = startTag
						.replace(/\sbandwidth="[^"]*"/, "")
						.replace(/\saudioSamplingRate="[^"]*"/, "")

					// Add new attributes
					newTag += ` bandwidth="${bandwidth}" audioSamplingRate="${samplingRate}"`

					return newTag + endTag
				},
			)

			await fs.promises.writeFile(mpdPath, mpdContent, "utf-8")
		} catch (error) {
			console.error(
				`[SegmentedAudioMPDJob] Error updating MPD bandwidth/audioSamplingRate for ${mpdPath}:`,
				error,
			)
		}
	}

	run = async () => {
		const outputPath =
			this.params.outputDir ?? `${path.dirname(this.params.input)}/dash`
		const outputFile = path.join(outputPath, this.params.outputMasterName)

		try {
			this.emit("start", {
				input: this.params.input,
				output: outputPath,
				params: this.params,
			})

			const inputProbe = await Utils.probe(this.params.input)

			if (
				this.params.audioCodec === "copy" &&
				codecOverrides[inputProbe.format.format_name]
			) {
				this.params.audioCodec =
					codecOverrides[inputProbe.format.format_name]
			}

			const segmentationCmd = this.buildSegmentationArgs()

			if (!fs.existsSync(outputPath)) {
				fs.mkdirSync(outputPath, { recursive: true })
			}

			const ffmpegResult = await this.ffmpeg({
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

			if (fs.existsSync(outputFile)) {
				await this._updateMpdMinBufferTime(
					outputFile,
					this.params.minBufferTime,
				)
			} else {
				console.warn(
					`[SegmentedAudioMPDJob] MPD file ${outputFile} not found after ffmpeg run. Skipping minBufferTime update.`,
				)
			}

			let outputProbe = await Utils.probe(outputFile)

			let bandwidth = null
			let samplingRate = null

			if (
				outputProbe &&
				outputProbe.streams &&
				outputProbe.streams.length > 0
			) {
				bandwidth =
					outputProbe.format.bit_rate ??
					outputProbe.streams[0].bit_rate

				samplingRate = outputProbe.streams[0].sample_rate
			}

			if (bandwidth && samplingRate) {
				await this._updateMpdBandwidthAndSamplingRate({
					mpdPath: outputFile,
					bandwidth: bandwidth,
					samplingRate: samplingRate,
				})
			}

			this.emit("end", {
				probe: {
					input: inputProbe,
					output: outputProbe,
				},
				outputPath: outputPath,
				outputFile: outputFile,
			})

			return ffmpegResult
		} catch (err) {
			this.emit("error", err)
		}
	}
}
