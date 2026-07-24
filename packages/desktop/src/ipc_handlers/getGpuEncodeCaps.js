import { app } from "electron"
import { execSync } from "node:child_process"

export default async function () {
	const hardwareCodecs = new Set()

	try {
		const raw = await app.getGPUInfo("complete")
		const gpuInfo = typeof raw === "string" ? JSON.parse(raw) : raw

		// try structured encoder info from complete gpu report
		const encoderSources = [
			gpuInfo?.videoAcceleratorInfo?.encoderInfo,
			gpuInfo?.gpu?.videoAcceleratorInfo?.encoderInfo,
		]

		for (const encoderInfo of encoderSources) {
			if (!Array.isArray(encoderInfo)) continue

			for (const enc of encoderInfo) {
				const name = (
					enc.name ||
					enc.codec ||
					enc.codec_name ||
					""
				).toLowerCase()

				if (name.includes("h264") || name.includes("avc")) {
					hardwareCodecs.add("video/h264")
				} else if (name.includes("av1")) {
					hardwareCodecs.add("video/AV1")
				} else if (name.includes("vp9")) {
					hardwareCodecs.add("video/VP9")
				} else if (name.includes("vp8")) {
					hardwareCodecs.add("video/VP8")
				}
			}
		}

		// try text-based fallback from complete gpu report
		if (hardwareCodecs.size === 0) {
			const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw)

			if (
				rawStr.includes("Encode h264") ||
				rawStr.includes("Encode avc")
			) {
				hardwareCodecs.add("video/h264")
			}
			if (rawStr.includes("Encode av1")) {
				hardwareCodecs.add("video/AV1")
			}
			if (rawStr.includes("Encode vp9")) {
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
				// parse profiles from vainfo output
				const profiles = new Set()
				const lines = output.split("\n")

				let currentProfile = ""

				for (const line of lines) {
					const profileMatch = line.match(/VAProfile(\w+)\s*:/)

					if (profileMatch) {
						currentProfile = profileMatch[1].toLowerCase()
					}

					if (
						currentProfile &&
						line.includes("VAEntrypointEncSlice")
					) {
						profiles.add(currentProfile)
					}
				}

				for (const profile of profiles) {
					if (profile.includes("h264")) {
						hardwareCodecs.add("video/h264")
					} else if (profile.includes("av1")) {
						hardwareCodecs.add("video/AV1")
					} else if (profile.includes("vp9")) {
						hardwareCodecs.add("video/VP9")
					}
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
