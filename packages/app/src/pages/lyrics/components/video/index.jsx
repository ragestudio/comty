import React from "react"
import HLS from "hls.js"
import classnames from "classnames"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

const maxLatencyInMs = 55

const LyricsVideo = React.forwardRef((props, videoRef) => {
	const [playerState] = usePlayerStateContext()
	const { lyrics } = props

	const [initialLoading, setInitialLoading] = React.useState(true)
	const [syncingVideo, setSyncingVideo] = React.useState(false)
	const [currentVideoLatency, setCurrentVideoLatency] = React.useState(0)
	// const isDebugEnabled = React.useMemo(
	// 	() => app.cores.settings.is("_debug", true),
	// 	[],
	//  )

	const isDebugEnabled = true

	const hls = React.useRef(
		new HLS({
			autoLevelEnabled: true,
		}),
	)
	const hlsStats = React.useRef(null)
	const syncIntervalRef = React.useRef(null)

	const stopSyncInterval = React.useCallback(() => {
		setSyncingVideo(false)
		if (syncIntervalRef.current) {
			clearInterval(syncIntervalRef.current)
			syncIntervalRef.current = null
		}
	}, [setSyncingVideo])

	const seekVideoToSyncAudio = React.useCallback(async () => {
		if (
			!lyrics ||
			!lyrics.video_source ||
			typeof lyrics.video_starts_at_ms === "undefined" ||
			!videoRef.current
		) {
			return null
		}

		const currentTrackTime = window.app.cores.player.controls.seek()
		setSyncingVideo(true)

		let newTime = currentTrackTime + lyrics.video_starts_at_ms / 1000

		// dec some ms to ensure the video seeks correctly
		newTime -= 10 / 1000

		// sum the audio gradual time fade
		newTime = newTime + 150 / 1000

		videoRef.current.currentTime = newTime
	}, [lyrics, videoRef, setSyncingVideo])

	const syncPlayback = React.useCallback(
		async (override = false) => {
			if (
				!videoRef.current ||
				!lyrics ||
				!lyrics.video_source ||
				lyrics.video_loop ||
				typeof lyrics.video_starts_at_ms === "undefined"
			) {
				stopSyncInterval()
				return
			}

			if (playerState.playback_status !== "playing" && !override) {
				stopSyncInterval()
				return
			}

			const currentTrackTime = window.app.cores.player.controls.seek()
			const currentVideoTime =
				videoRef.current.currentTime - lyrics.video_starts_at_ms / 1000
			const maxOffset = maxLatencyInMs / 1000
			const currentVideoTimeDiff = Math.abs(
				currentVideoTime - currentTrackTime,
			)

			setCurrentVideoLatency(currentVideoTimeDiff)

			if (syncingVideo === true) {
				return
			}

			if (currentVideoTimeDiff > maxOffset) {
				seekVideoToSyncAudio()
			}
		},
		[
			videoRef,
			lyrics,
			playerState.playback_status,
			setCurrentVideoLatency,
			syncingVideo,
			seekVideoToSyncAudio,
			stopSyncInterval,
		],
	)

	const startSyncInterval = React.useCallback(() => {
		if (syncIntervalRef.current) {
			clearInterval(syncIntervalRef.current)
		}
		syncIntervalRef.current = setInterval(syncPlayback, 300)
	}, [syncPlayback])

	React.useEffect(() => {
		setCurrentVideoLatency(0)
		const videoElement = videoRef.current
		if (!videoElement) return

		if (lyrics && lyrics.video_source) {
			console.log("VIDEO:: Loading video source >", lyrics.video_source)

			if (
				hls.current.media === videoElement &&
				(lyrics.video_source.endsWith(".mp4") || !lyrics.video_source)
			) {
				hls.current.stopLoad()
			}

			if (lyrics.video_source.endsWith(".mp4")) {
				if (hls.current.media === videoElement) {
					hls.current.detachMedia()
				}
				videoElement.src = lyrics.video_source
			} else {
				if (HLS.isSupported()) {
					if (hls.current.media !== videoElement) {
						hls.current.attachMedia(videoElement)
					}

					hls.current.loadSource(lyrics.video_source)

					// attach hls debug messages
					hls.current.on(HLS.Events.FRAG_LOADED, (event, data) => {
						console.debug("VIDEO:: Fragment Loaded", data)
					})

					hls.current.on(HLS.Events.LEVEL_LOADED, (event, data) => {
						console.debug("VIDEO:: Level Loaded", data)
					})

					hls.current.on(HLS.Events.LEVEL_SWITCHED, (event, data) => {
						console.debug("VIDEO:: Level Switched", data)
					})
				} else if (
					videoElement.canPlayType("application/vnd.apple.mpegurl")
				) {
					videoElement.src = lyrics.video_source
				}
			}

			if (typeof lyrics.video_starts_at_ms !== "undefined") {
				videoElement.loop = lyrics.video_loop ?? false
				syncPlayback(true)
			} else {
				videoElement.loop = lyrics.video_loop ?? true
				videoElement.currentTime = 0
			}
		} else {
			videoElement.src = ""

			if (hls.current) {
				hls.current.stopLoad()
				if (hls.current.media) {
					hls.current.detachMedia()
				}
			}
		}
		setInitialLoading(false)
	}, [lyrics, videoRef, hls, setCurrentVideoLatency, setInitialLoading])

	React.useEffect(() => {
		stopSyncInterval()

		if (initialLoading || !videoRef.current) {
			return
		}

		const videoElement = videoRef.current
		const canPlayVideo = lyrics && lyrics.video_source

		if (!canPlayVideo) {
			videoElement.pause()
			return
		}

		if (
			playerState.loading === true &&
			playerState.playback_status === "playing"
		) {
			videoElement.pause()
			return
		}

		const shouldSync = typeof lyrics.video_starts_at_ms !== "undefined"

		if (playerState.playback_status === "playing") {
			videoElement
				.play()
				.catch((error) =>
					console.error("VIDEO:: Error playing video:", error),
				)
			if (shouldSync) {
				startSyncInterval()
			}
		} else {
			videoElement.pause()
		}
	}, [
		lyrics,
		playerState.playback_status,
		playerState.loading,
		initialLoading,
		videoRef,
		startSyncInterval,
		stopSyncInterval,
	])

	React.useEffect(() => {
		const videoElement = videoRef.current
		const hlsInstance = hls.current

		const handleSeeked = () => {
			setSyncingVideo(false)
		}

		if (videoElement) {
			videoElement.addEventListener("seeked", handleSeeked)
		}

		console.log(hlsInstance, hlsInstance.getHlsJsInstance)

		return () => {
			stopSyncInterval()

			if (videoElement) {
				videoElement.removeEventListener("seeked", handleSeeked)
			}
			if (hlsInstance) {
				hlsInstance.destroy()
			}
		}
	}, [videoRef, hls, stopSyncInterval, setSyncingVideo])

	return (
		<>
			{isDebugEnabled && (
				<div className={classnames("videoDebugOverlay")}>
					<div>
						<p>Sync enabled: {lyrics?.video_loop ? "No" : "Yes"}</p>
					</div>
					<div>
						<p>A/V Start: {lyrics?.video_starts_at || "N/A"}</p>
					</div>
					<div>
						<p>Maximun latency: {maxLatencyInMs}ms</p>
					</div>
					<div>
						<p>
							Video Latency:{" "}
							{(currentVideoLatency * 1000).toFixed(2)}ms
						</p>
					</div>
					<div>
						<p>Is Syncing: {syncingVideo ? "Yes" : "No"}</p>
					</div>

					<div>
						<p>
							Video codec:{" "}
							{hls.current?.levels[0]?.codec || "N/A"}
						</p>
					</div>
				</div>
			)}

			<video
				className={classnames("lyrics-video", {
					["hidden"]: !lyrics || !lyrics?.video_source,
				})}
				ref={videoRef}
				controls={false}
				muted
				preload="auto"
				playsInline
			/>
		</>
	)
})

LyricsVideo.displayName = "LyricsVideo"

export default LyricsVideo
