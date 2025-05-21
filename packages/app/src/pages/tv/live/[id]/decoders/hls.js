import Hls from "hls.js"

const Events = {
	[Hls.Events.FPS_DROP]: (event, data) => {
		console.warn("[HLS] FPS_DROP Detected", data)
	},
	[Hls.Events.ERROR]: (event, data) => {
		console.error("[HLS] Error", data)
	},
}

export default (player, sources = {}, options = {}) => {
	if (!player) {
		console.error("[HLS] player is not defined")
		return false
	}

	if (!sources.hls) {
		console.error("[HLS] an hls source is not provided")
		return false
	}

	let source = sources.hls

	const hlsInstance = new Hls({
		maxLiveSyncPlaybackRate: 1.5,
		strategy: "bandwidth",
		autoplay: true,
		xhrSetup: (xhr) => {
			if (options.authToken) {
				xhr.setRequestHeader(
					"Authorization",
					`Bearer ${options.authToken}`,
				)
			}
		},
	})

	if (options.authToken) {
		source += `?token=${options.authToken}`
	}

	console.log(`[HLS] Loading source [${source}]`)

	hlsInstance.attachMedia(player)

	// when media attached, load source
	hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
		hlsInstance.loadSource(source)
	})

	// handle when media ends
	hlsInstance.on(Hls.Events.BUFFER_EOS, () => {
		console.log("[HLS] Media ended")

		if (typeof options.onSourceEnd === "function") {
			options.onSourceEnd()
		}
	})

	// process quality and tracks levels
	hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
		console.log("[HLS] Manifest parsed >", data)
	})

	// resume to the last position when player resume playback
	player.addEventListener("play", () => {
		console.log("[HLS] Syncing to last position")
		player.currentTime = hlsInstance.liveSyncPosition
	})

	// register hls decoder events
	Object.keys(Events).forEach((event) => {
		hlsInstance.on(event, Events[event])
	})

	return hlsInstance
}
