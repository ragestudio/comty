export default (app) => {
	if (process.argv.some((arg) => arg === "--no-flags")) return

	const disableFeatures = ["WebRtcAllowInputVolumeAdjustment"]

	const enableFeatures = [
		"WebRTC",
		"WebRtcHideLocalIpsWithMdns",
		"CanvasOopRasterization",
		//"EnableDrDc",
		//"UseSkiaRenderer",
	]

	if (process.platform === "linux") {
		enableFeatures.push("WebRTCPipeWireCapturer")

		if (!process.argv.some((arg) => arg === "--no-vaapi")) {
			enableFeatures.push(
				"AcceleratedVideoDecodeLinuxGL",
				"AcceleratedVideoEncoder",
				"AcceleratedVideoDecoder",
				"AcceleratedVideoDecodeLinuxZeroCopyGL",
				"VaapiVideoEncoder",
				"VaapiVideoEncodeAV1",
				"VaapiVideoDecodeLinuxGL",
				"VaapiIgnoreDriverChecks",
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
		// disable renderer backgrounding to prevent the app from unloading when in the background
		["disable-renderer-backgrounding"],
		["disable-background-timer-throttling"],
		["disable-disable-backgrounding-occluded-windows"],
		["disable-features", disableFeatures.join(",")],
		["enable-features", enableFeatures.join(",")],
	]

	if (
		process.platform === "linux" &&
		!process.argv.some((arg) => arg === "--no-vaapi")
	) {
		switches.push(
			["ignore-gpu-blocklist"],
			["use-gl", "angle"],
			["use-angle", "gl-egl"],
		)
	}

	for (const [key, val] of switches) {
		app.commandLine.appendSwitch(key, val)
	}
}
