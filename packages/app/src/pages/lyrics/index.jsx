import React from "react"
import classnames from "classnames"

import parseTimeToMs from "@utils/parseTimeToMs"

import useMaxScreen from "@hooks/useMaxScreen"
import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import PlayerController from "./components/controller"
import LyricsVideo from "./components/video"
import LyricsText from "./components/text"

import "./index.less"

function getDominantColorStr(analysis) {
	if (!analysis) {
		return `0,0,0`
	}

	const values = analysis?.value ?? [0, 0, 0]

	return `${values[0]}, ${values[1]}, ${values[2]}`
}

function toggleFullScreen(to) {
	to = to ?? !document.fullscreenElement

	if (to === true) {
		document.documentElement.requestFullscreen().catch((err) => {
			console.log(`Failed to set to fullscreen: ${err.message}`)
		})
	} else {
		try {
			document.exitFullscreen()
		} catch (error) {
			// xd
		}
	}
}

const EnchancedLyricsPage = () => {
	const [playerState] = usePlayerStateContext()
	const [trackManifest, setTrackManifest] = React.useState(null)

	const [initialized, setInitialized] = React.useState(false)
	const [lyrics, setLyrics] = React.useState(null)
	const [translationEnabled, setTranslationEnabled] = React.useState(false)
	const [coverAnalysis, setCoverAnalysis] = React.useState(null)

	const videoRef = React.useRef()
	const textRef = React.useRef()

	function listenFullScreenChange() {
		if (!document.fullscreenElement) {
			if (app.location.last) {
				app.location.back()
			} else {
				app.navigation.goMain()
			}
		}
	}

	async function loadCurrentTrackLyrics() {
		// get current track instance
		const instance = app.cores.player.track()

		let result = await instance.manifest.serviceOperations
			.fetchLyrics({
				preferTranslation: translationEnabled,
			})
			.catch((err) => {
				console.error("Failed to fetch lyrics", err)
				return null
			})

		if (result.sync_audio_at && !result.sync_audio_at_ms) {
			result.sync_audio_at_ms = parseTimeToMs(result.sync_audio_at)
		}

		console.log("Fetched Lyrics >", result)

		if (result) {
			setLyrics(result)
		} else {
			setLyrics(false)
		}
	}

	async function toggleTranslationEnabled(to) {
		setTranslationEnabled((prev) => {
			return to ?? !prev
		})
	}

	useMaxScreen()

	// React.useEffect((prev) => {
	//     if (initialized) {
	//         loadLyrics(playerState.track_manifest)
	//     }
	// }, [translationEnabled])

	//* Handle when context change track_manifest
	React.useEffect(() => {
		if (trackManifest && playerState.track_manifest) {
			if (!lyrics || lyrics.track_id !== playerState.track_manifest._id) {
				loadCurrentTrackLyrics()
			}
		} else {
			setLyrics(null)
		}
	}, [trackManifest])

	React.useEffect(() => {
		if (!playerState.track_manifest) {
			return
		}

		const currentPlayerTrackManifest =
			playerState.track_manifest.toSeriableObject()

		// check if track manifest is the same
		if (trackManifest === currentPlayerTrackManifest) {
			return
		}

		setTrackManifest(currentPlayerTrackManifest)
	}, [playerState])

	React.useEffect(() => {
		const trackInstance = app.cores.player.track()

		if (playerState.track_manifest && trackInstance) {
			if (
				typeof trackInstance.manifest.analyzeCoverColor === "function"
			) {
				trackInstance.manifest
					.analyzeCoverColor()
					.then((analysis) => {
						setCoverAnalysis(analysis)
					})
					.catch((err) => {
						console.error("Failed to get cover analysis", err)
					})
			}
		}
	}, [playerState.track_manifest])

	React.useEffect(() => {
		setInitialized(true)
		toggleFullScreen(true)

		document.addEventListener("fullscreenchange", listenFullScreenChange)

		return () => {
			toggleFullScreen(false)
			document.removeEventListener(
				"fullscreenchange",
				listenFullScreenChange,
			)
		}
	}, [])

	return (
		<div
			className={classnames("lyrics", {
				["stopped"]: playerState.playback_status !== "playing",
			})}
			style={{
				"--dominant-color": getDominantColorStr(coverAnalysis),
			}}
		>
			<div className="lyrics-background-color" />

			{playerState.track_manifest && !lyrics?.video_source && (
				<div className="lyrics-background-wrapper">
					<div className="lyrics-background-cover">
						<img src={playerState.track_manifest.cover} />
					</div>
				</div>
			)}

			<LyricsVideo ref={videoRef} lyrics={lyrics} />

			<LyricsText ref={textRef} lyrics={lyrics} />

			<PlayerController
				lyrics={lyrics}
				translationEnabled={translationEnabled}
				toggleTranslationEnabled={toggleTranslationEnabled}
			/>
		</div>
	)
}

export default EnchancedLyricsPage
