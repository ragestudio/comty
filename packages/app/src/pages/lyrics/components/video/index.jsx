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
	const isDebugEnabled = React.useMemo(
		() => app.cores.settings.is("_debug", true),
		[],
	)

	const hls = React.useRef(new HLS())
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
			typeof lyrics.sync_audio_at_ms === "undefined" ||
			!videoRef.current
		) {
			return null
		}

		const currentTrackTime = window.app.cores.player.controls.seek()
		setSyncingVideo(true)

		let newTime =
			currentTrackTime + lyrics.sync_audio_at_ms / 1000 + 150 / 1000
		newTime -= 5 / 1000

		videoRef.current.currentTime = newTime
	}, [lyrics, videoRef, setSyncingVideo])

	const syncPlayback = React.useCallback(
		async (override = false) => {
			if (
				!videoRef.current ||
				!lyrics ||
				!lyrics.video_source ||
				typeof lyrics.sync_audio_at_ms === "undefined"
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
				videoRef.current.currentTime - lyrics.sync_audio_at_ms / 1000
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
				} else if (
					videoElement.canPlayType("application/vnd.apple.mpegurl")
				) {
					videoElement.src = lyrics.video_source
				}
			}

			if (typeof lyrics.sync_audio_at_ms !== "undefined") {
				videoElement.loop = false
				syncPlayback(true)
			} else {
				videoElement.loop = true
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

		const shouldSync = typeof lyrics.sync_audio_at_ms !== "undefined"

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
						<p>Maximun latency</p>
						<p>{maxLatencyInMs}ms</p>
					</div>
					<div>
						<p>Video Latency</p>
						<p>{(currentVideoLatency * 1000).toFixed(2)}ms</p>
					</div>
					{syncingVideo ? <p>Syncing video...</p> : null}
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

export default LyricsVideo
