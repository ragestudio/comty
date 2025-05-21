import shaka from "shaka-player"

export default async (player, sources = {}, options = {}) => {
	if (!player) {
		console.error("[Shaka] player is not defined")
		return false
	}

	if (!sources.hls) {
		console.error("[Shaka] an hls source is not provided")
		return false
	}

	let source = sources.hls

	// Initialize shaka player
	const shakaInstance = new shaka.Player(player)

	// Helper function to sync to live edge
	const syncToLive = () => {
		if (shakaInstance.isLive()) {
			const end = shakaInstance.seekRange().end
			player.currentTime = end
		}
	}

	// Configure for low-latency HLS
	shakaInstance.configure({
		streaming: {
			lowLatencyMode: true,
			inaccurateManifestTolerance: 0,
			rebufferingGoal: 0.01,
			bufferingGoal: 0.1,
			bufferBehind: 30,
			startAtSegmentBoundary: false,
			durationBackoff: 0.2,
		},
	})

	// Add request filter for authentication if token is provided
	if (options.authToken) {
		shakaInstance
			.getNetworkingEngine()
			.registerRequestFilter((type, request) => {
				request.headers = {
					...request.headers,
					Authorization: `Bearer ${options.authToken}`,
				}
			})
		source += `?token=${options.authToken}`
	}

	console.log("[Shaka] Instance options >", options)
	console.log(`[Shaka] Loading source [${source}]`)

	// Error handling
	shakaInstance.addEventListener("error", (error) => {
		console.error("[Shaka] Error", error)
	})

	// Buffer state monitoring
	player.addEventListener("waiting", () => {
		console.log("[Shaka] Buffer underrun")
	})

	// Handle stream end
	player.addEventListener("ended", () => {
		console.log("[Shaka] Stream ended")
		if (typeof options.onSourceEnd === "function") {
			options.onSourceEnd()
		}
	})

	try {
		await shakaInstance.load(source)
		console.log("[Shaka] Stream loaded successfully")

		const tracks = shakaInstance.getVariantTracks()
		console.log("[Shaka] Available qualities >", tracks)
	} catch (error) {
		console.error("[Shaka] Error loading stream:", error)
	}

	player.addEventListener("play", () => {
		console.log("[SHAKA] Syncing to last position")
		syncToLive()
	})

	// Add destroy method for cleanup
	shakaInstance._destroy = () => {
		try {
			shakaInstance.unload()
			shakaInstance.destroy()
		} catch (error) {
			console.error("[Shaka] Error during cleanup:", error)
		}
	}

	return shakaInstance
}
