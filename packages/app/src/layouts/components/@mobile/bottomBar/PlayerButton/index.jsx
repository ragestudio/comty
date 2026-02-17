import React from "react"
import classnames from "classnames"

import { Icons } from "@components/Icons"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import PlayerView from "@pages/@mobile-views/player"

const openPlayerView = () => {
	app.layout.draggable.open("player", PlayerView, {
		snapPoints: ["850px", 1],
	})
}

const PlayerButton = () => {
	const [currentManifest, setCurrentManifest] = React.useState(null)
	const [coverAnalyzed, setCoverAnalyzed] = React.useState(null)

	const [player] = usePlayerStateContext((state) => {
		setCurrentManifest((prev) => {
			if (!state.track_manifest) {
				return null
			}

			if (prev?._id !== (state.track_manifest?._id ?? state.radioId)) {
				return state.track_manifest
			}

			return prev
		})
	})

	React.useEffect(() => {
		if (currentManifest) {
			const track = app.cores.player.track()

			if (!app.layout.draggable.exists("player")) {
				openPlayerView()
			}

			if (track?.analyzeCoverColor) {
				track
					.analyzeCoverColor()
					.then((analysis) => {
						setCoverAnalyzed(analysis)
					})
					.catch((err) => {
						console.error(err)
					})
			}
		}
	}, [currentManifest])

	const isPlaying = player && player?.playback_status === "playing"

	if (!currentManifest) {
		return null
	}

	return (
		<div className="item">
			<div
				className={classnames("player_btn", {
					bounce: isPlaying,
				})}
				style={{
					"--average-color": coverAnalyzed?.rgba,
					"--color": coverAnalyzed?.isDark
						? "var(--text-color-white)"
						: "var(--text-color-black)",
				}}
				onClick={openPlayerView}
			>
				{isPlaying ? <Icons.Music2 /> : <Icons.Pause />}
			</div>
		</div>
	)
}

export default PlayerButton
