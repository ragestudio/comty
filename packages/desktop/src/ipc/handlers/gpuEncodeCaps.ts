import { app } from "electron"
import { execSync } from "node:child_process"

interface EncoderInfo {
	name?: string
	codec?: string
	codec_name?: string
}

interface GpuInfoReport {
	videoAcceleratorInfo?: {
		encoderInfo?: EncoderInfo[]
	}
	gpu?: {
		videoAcceleratorInfo?: {
			encoderInfo?: EncoderInfo[]
		}
	}
}

function addCodec(codecs: Set<string>, name: string) {
	if (name.includes("h264") || name.includes("avc")) {
		codecs.add("video/h264")
	} else if (name.includes("av1")) {
		codecs.add("video/AV1")
	} else if (name.includes("vp9")) {
		codecs.add("video/VP9")
	} else if (name.includes("vp8")) {
		codecs.add("video/VP8")
	}
}

export default async function getGpuEncodeCaps(): Promise<string[]> {
	const hardwareCodecs = new Set<string>()

	try {
		const raw = (await app.getGPUInfo("complete")) as unknown
		const gpuInfo = (
			typeof raw === "string" ? JSON.parse(raw) : raw
		) as GpuInfoReport

		// try structured encoder info from the complete gpu report
		const encoderSources = [
			gpuInfo?.videoAcceleratorInfo?.encoderInfo,
			gpuInfo?.gpu?.videoAcceleratorInfo?.encoderInfo,
		]

		for (const encoderInfo of encoderSources) {
			if (!Array.isArray(encoderInfo)) continue

			for (const encoder of encoderInfo) {
				const name = (
					encoder.name ||
					encoder.codec ||
					encoder.codec_name ||
					""
				).toLowerCase()

				addCodec(hardwareCodecs, name)
			}
		}

		// try text based fallback from the complete gpu report
		if (hardwareCodecs.size === 0) {
			const rawString = typeof raw === "string" ? raw : JSON.stringify(raw)

			if (
				rawString.includes("Encode h264") ||
				rawString.includes("Encode avc")
			) {
				hardwareCodecs.add("video/h264")
			}
			if (rawString.includes("Encode av1")) {
				hardwareCodecs.add("video/AV1")
			}
			if (rawString.includes("Encode vp9")) {
				hardwareCodecs.add("video/VP9")
			}
		}
	} catch (error) {
		console.error("[gpu] error reading gpu info:", error)
	}

	// try vainfo on linux
	if (hardwareCodecs.size === 0 && process.platform === "linux") {
		try {
			const output = execSync(
				"vainfo --display drm --device /dev/dri/renderD128 2>/dev/null",
				{ encoding: "utf-8", timeout: 3000 },
			)

			if (output.includes("VAEntrypointEncSlice")) {
				const profiles = new Set<string>()

				let currentProfile = ""

				for (const line of output.split("\n")) {
					const profileMatch = line.match(/VAProfile(\w+)\s*:/)

					if (profileMatch) {
						currentProfile = profileMatch[1].toLowerCase()
					}

					if (currentProfile && line.includes("VAEntrypointEncSlice")) {
						profiles.add(currentProfile)
					}
				}

				for (const profile of profiles) {
					addCodec(hardwareCodecs, profile)
				}
			}
		} catch {
			// vainfo not available, continue
		}
	}

	// if everything else fails, assume vaapi is enabled on linux,
	// assuming h264 at minimum
	if (hardwareCodecs.size === 0 && process.platform === "linux") {
		const features = app.commandLine.getSwitchValue("enable-features")

		if (features?.includes("VaapiVideoEncoder")) {
			hardwareCodecs.add("video/h264")
		}
	}

	console.log("[gpu] hardware encode codecs:", [...hardwareCodecs])

	return [...hardwareCodecs]
}
