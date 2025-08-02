import { app } from "electron"

export default () => {
	if (process.argv.some((arg) => arg === "--no-flags")) return

	const disableFeatures = [
		"UseChromeOSDirectVideoDecoder",
		"HardwareMediaKeyHandling",
		"MediaSessionService",
		"WebRtcAllowInputVolumeAdjustment",
		"Vulkan",
	]
	const enableFeatures = [
		"WebRTC",
		"WebRtcHideLocalIpsWithMdns",
		"PlatformHEVCEncoderSupport",
		"EnableDrDc",
		"CanvasOopRasterization",
		"UseSkiaRenderer",
	]

	if (process.platform === "linux") {
		// enableFeatures.push("PulseaudioLoopbackForScreenShare")

		if (!process.argv.some((arg) => arg === "--no-vaapi")) {
			enableFeatures.push(
				"AcceleratedVideoDecodeLinuxGL",
				"AcceleratedVideoEncoder",
				"AcceleratedVideoDecoder",
				"AcceleratedVideoDecodeLinuxZeroCopyGL",
			)
		}
	}

	if (process.platform === "win32") {
		disableFeatures.push("CalculateNativeWinOcclusion")
	}

	const switches = [
		["enable-gpu-rasterization"],
		["enable-zero-copy"],
		["disable-low-res-tiling"],
		["disable-site-isolation-trials"],
		[
			"enable-hardware-overlays",
			"single-fullscreen,single-on-top,underlay",
		],
		["autoplay-policy", "no-user-gesture-required"],
		["enable-speech-dispatcher"],
		["disable-http-cache"], // Work around https://github.com/electron/electron/issues/40777
		["gtk-version", "3"], // https://github.com/electron/electron/issues/46538
		// disable renderer backgrounding to prevent the app from unloading when in the background
		["disable-renderer-backgrounding"],
		["disable-background-timer-throttling"],
		["disable-disable-backgrounding-occluded-windows"],
		["disable-features", disableFeatures.join(",")],
		["enable-features", enableFeatures.join(",")],
	]

	for (const [key, val] of switches) {
		app.commandLine.appendSwitch(key, val)
	}
}
