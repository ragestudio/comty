import React from "react"
import classnames from "classnames"

import useFullScreen from "@hooks/useFullScreen"
import useSyncRoom from "@hooks/useSyncRoom"
import useCoverAnalysis from "@hooks/useCoverAnalysis"
import useLyrics from "@hooks/useLyrics"
import useMaxScreen from "@hooks/useMaxScreen"
import useTrackManifest from "@hooks/useTrackManifest"
import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import PlayerController from "./components/controller"
import LyricsVideo from "./components/video"
import LyricsText from "./components/text"
import Background from "./components/Background"

import "./index.less"

const EnhancedLyricsPage = () => {
	useMaxScreen()

	const [playerState] = usePlayerStateContext()

	const videoRef = React.useRef()
	const textRef = React.useRef()

	const { toggleFullScreen } = useFullScreen({
		onExit: () => app?.location?.last && app.location.back(),
	})

	const { trackManifest } = useTrackManifest(playerState.track_manifest)

	const { dominantColor } = useCoverAnalysis(trackManifest)

	const { syncRoom, subscribeLyricsUpdates, unsubscribeLyricsUpdates } =
		useSyncRoom()

	const { lyrics, setLyrics } = useLyrics({
		trackManifest,
	})

	// Inicialización y limpieza
	React.useEffect(() => {
		toggleFullScreen(true)

		if (syncRoom) {
			subscribeLyricsUpdates(setLyrics)
		}

		return () => {
			toggleFullScreen(false)

			if (syncRoom) {
				unsubscribeLyricsUpdates(setLyrics)
			}
		}
	}, [])

	return (
		<div
			className={classnames("lyrics", {
				stopped: playerState.playback_status !== "playing",
			})}
			style={dominantColor}
		>
			<div className="lyrics-background-color" />

			{playerState.playback_status === "stopped" && (
				<div className="lyrics-stopped-decorator">
					<img src="./basic_alt.svg" alt="Basic Logo" />
				</div>
			)}

			<Background
				trackManifest={trackManifest}
				hasVideoSource={!!lyrics?.video_source}
			/>

			<LyricsVideo ref={videoRef} lyrics={lyrics} />
			<LyricsText ref={textRef} lyrics={lyrics} />

			<PlayerController lyrics={lyrics} />
		</div>
	)
}

export default EnhancedLyricsPage
