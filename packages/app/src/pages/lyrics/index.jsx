import React, { useCallback, useEffect, useMemo, useRef } from "react"
import classnames from "classnames"

import parseTimeToMs from "@utils/parseTimeToMs"
import useMaxScreen from "@hooks/useMaxScreen"
import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import PlayerController from "./components/controller"
import LyricsVideo from "./components/video"
import LyricsText from "./components/text"

import "./index.less"

const getDominantColorStr = (analysis) => {
	if (!analysis) return "0,0,0"
	return analysis.value?.join(", ") || "0,0,0"
}

const toggleFullScreen = (to) => {
	const targetState = to ?? !document.fullscreenElement

	try {
		if (targetState) {
			document.documentElement.requestFullscreen()
		} else if (document.fullscreenElement) {
			document.exitFullscreen()
		}
	} catch (error) {
		console.error("Fullscreen toggle failed:", error)
	}
}

const EnhancedLyricsPage = () => {
	useMaxScreen()

	const [playerState] = usePlayerStateContext()
	const [trackManifest, setTrackManifest] = React.useState(null)
	const [lyrics, setLyrics] = React.useState(null)
	const [translationEnabled, setTranslationEnabled] = React.useState(false)
	const [coverAnalysis, setCoverAnalysis] = React.useState(null)

	const videoRef = useRef()
	const textRef = useRef()
	const isMounted = useRef(true)
	const currentTrackId = useRef(null)

	const dominantColor = useMemo(
		() => ({ "--dominant-color": getDominantColorStr(coverAnalysis) }),
		[coverAnalysis],
	)

	const handleFullScreenChange = useCallback(() => {
		if (!document.fullscreenElement && app?.location?.last) {
			app.location.back()
		}
	}, [])

	const loadCurrentTrackLyrics = useCallback(async () => {
		if (!playerState.track_manifest) return

		const instance = app.cores.player.track()
		if (!instance) return

		try {
			const result =
				await instance.manifest.serviceOperations.fetchLyrics({
					preferTranslation: translationEnabled,
				})

			if (!isMounted.current) return

			const processedLyrics =
				result.sync_audio_at && !result.sync_audio_at_ms
					? {
							...result,
							sync_audio_at_ms: parseTimeToMs(
								result.sync_audio_at,
							),
						}
					: result

			console.log("Fetched Lyrics >", processedLyrics)
			setLyrics(processedLyrics || false)
		} catch (error) {
			console.error("Failed to fetch lyrics", error)
			setLyrics(false)
		}
	}, [translationEnabled, playerState.track_manifest])

	// Track manifest comparison
	useEffect(() => {
		const newManifest = playerState.track_manifest

		if (JSON.stringify(newManifest) !== JSON.stringify(trackManifest)) {
			setTrackManifest(newManifest)
		}
	}, [playerState.track_manifest])

	// Lyrics loading trigger
	useEffect(() => {
		if (!trackManifest) {
			setLyrics(null)
			return
		}

		if (!lyrics || lyrics.track_id !== trackManifest._id) {
			loadCurrentTrackLyrics()
		}
	}, [trackManifest, lyrics?.track_id])

	// Cover analysis
	useEffect(() => {
		const getCoverAnalysis = async () => {
			const trackInstance = app.cores.player.track()
			if (!trackInstance?.manifest.analyzeCoverColor) return

			try {
				const analysis =
					await trackInstance.manifest.analyzeCoverColor()
				if (isMounted.current) setCoverAnalysis(analysis)
			} catch (error) {
				console.error("Failed to get cover analysis", error)
			}
		}

		if (playerState.track_manifest) {
			getCoverAnalysis()
		}
	}, [playerState.track_manifest])

	// Initialization and cleanup
	useEffect(() => {
		isMounted.current = true
		toggleFullScreen(true)
		document.addEventListener("fullscreenchange", handleFullScreenChange)

		return () => {
			isMounted.current = false
			toggleFullScreen(false)
			document.removeEventListener(
				"fullscreenchange",
				handleFullScreenChange,
			)
		}
	}, [])

	// Translation toggler
	const handleTranslationToggle = useCallback(
		(to) => setTranslationEnabled((prev) => to ?? !prev),
		[],
	)

	// Memoized background component
	const renderBackground = useMemo(() => {
		if (!playerState.track_manifest || lyrics?.video_source) return null

		return (
			<div className="lyrics-background-wrapper">
				<div className="lyrics-background-cover">
					<img
						src={playerState.track_manifest.cover}
						alt="Album cover"
					/>
				</div>
			</div>
		)
	}, [playerState.track_manifest, lyrics?.video_source])

	return (
		<div
			className={classnames("lyrics", {
				stopped: playerState.playback_status !== "playing",
			})}
			style={dominantColor}
		>
			<div className="lyrics-background-color" />

			{renderBackground}

			<LyricsVideo ref={videoRef} lyrics={lyrics} />
			<LyricsText ref={textRef} lyrics={lyrics} />
			<PlayerController
				lyrics={lyrics}
				translationEnabled={translationEnabled}
				toggleTranslationEnabled={handleTranslationToggle}
			/>
		</div>
	)
}

export default EnhancedLyricsPage
