import type { App } from "electron"

export default function applyFlags(app: App) {
	if (process.argv.includes("--no-flags")) return

	const disableFeatures = ["WebRtcAllowInputVolumeAdjustment"]

	const enableFeatures = [
		"SharedArrayBuffer",
		"WebRTC",
		"WebRtcHideLocalIpsWithMdns",
		"CanvasOopRasterization",
	]

	const noVaapi = process.argv.includes("--no-vaapi")

	if (process.platform === "linux") {
		enableFeatures.push(
			"WebRTCPipeWireCapturer",
			"AcceleratedVideoDecoder",
			"AcceleratedVideoEncoder",
			"AcceleratedVideoDecodeLinuxZeroCopyGL",
		)

		if (!noVaapi) {
			enableFeatures.push("VaapiVideoDecoder", "VaapiVideoEncoder")
		}

		disableFeatures.push("UseChromeOSDirectVideoDecoder")
	}

	if (process.platform === "win32") {
		disableFeatures.push("CalculateNativeWinOcclusion")
	}

	const switches: Array<[string] | [string, string]> = [
		["enable-gpu-rasterization"],
		["enable-zero-copy"],
		["disable-low-res-tiling"],
		["disable-site-isolation-trials"],
		["enable-hardware-overlays", "single-fullscreen,single-on-top,underlay"],
		["autoplay-policy", "no-user-gesture-required"],
		["enable-speech-dispatcher"],
		// disable renderer backgrounding to prevent the app from unloading when in the background
		["disable-renderer-backgrounding"],
		["disable-background-timer-throttling"],
		["disable-disable-backgrounding-occluded-windows"],
		["disable-features", disableFeatures.join(",")],
		["enable-features", enableFeatures.join(",")],
	]

	if (process.platform === "linux" && !noVaapi) {
		switches.push(
			["ignore-gpu-blocklist"],
			["use-gl", "angle"],
			["use-angle", "gl-egl"],
		)
	}

	for (const [key, value] of switches) {
		app.commandLine.appendSwitch(key, value)
	}
}
