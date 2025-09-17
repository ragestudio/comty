import React from "react"
import * as antd from "antd"

import UseAnimations from "react-useanimations"
import LoadingAnimation from "react-useanimations/lib/loading"

import { Icons } from "@components/Icons"
import LikeButton from "@components/LikeButton"
import AudioVolume from "@components/Player/AudioVolume"
import AudioPlayerChangeModeButton from "@components/Player/ChangeModeButton"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import "./index.less"

const EventsHandlers = {
	playback: (state) => {
		if (state.live) {
			return false
		}
		return app.cores.player.playback.toggle()
	},
	previous: () => {
		return app.cores.player.playback.previous()
	},
	next: () => {
		return app.cores.player.playback.next()
	},
	volume: (ctx, value) => {
		return app.cores.player.controls.volume(value)
	},
	mute: () => {
		return app.cores.player.controls.mute("toggle")
	},
	like: async (ctx) => {
		if (!ctx.track_manifest) {
			return false
		}

		const track = app.cores.player.track()

		return await track.serviceOperations.toggleItemFavorite(
			"track",
			track._id,
		)
	},
}

const Controls = (props) => {
	const [trackManifest, setTrackManifest] = React.useState({})

	const onPlayerStateChange = React.useCallback((state) => {
		const track = app.cores.player.track()

		if (track) {
			setTrackManifest(track)
		}
	}, [])

	const [playerState] = usePlayerStateContext(onPlayerStateChange)

	const handleAction = (event, ...args) => {
		if (typeof EventsHandlers[event] !== "function") {
			throw new Error(`Unknown event "${event}"`)
		}

		return EventsHandlers[event](playerState, ...args)
	}

	return (
		<div className={props.className ?? "player-controls"}>
			<AudioPlayerChangeModeButton disabled={props.streamMode} />
			<antd.Button
				type="ghost"
				shape="round"
				icon={<Icons.FiChevronLeft />}
				onClick={() => handleAction("previous")}
				disabled={props.streamMode}
			/>
			<antd.Button
				type="primary"
				shape="circle"
				icon={
					props.streamMode ? (
						<Icons.Square />
					) : playerState.playback_status === "playing" ? (
						<Icons.Pause />
					) : (
						<Icons.Play />
					)
				}
				onClick={() => handleAction("playback")}
				className="playButton"
			>
				{playerState.loading && (
					<div className="loadCircle">
						<UseAnimations
							animation={LoadingAnimation}
							size="100%"
						/>
					</div>
				)}
			</antd.Button>
			<antd.Button
				type="ghost"
				shape="round"
				icon={<Icons.ArrowRight />}
				onClick={() => handleAction("next")}
				disabled={props.streamMode}
			/>
			{!app.isMobile && (
				<antd.Popover
					content={React.createElement(AudioVolume, {
						onChange: (value) => handleAction("volume", value),
						defaultValue: playerState.volume,
					})}
					trigger="hover"
				>
					<button
						className="muteButton"
						onClick={() => handleAction("mute")}
					>
						{playerState.muted ? (
							<Icons.VolumeX />
						) : (
							<Icons.Volume2 />
						)}
					</button>
				</antd.Popover>
			)}

			{app.isMobile && (
				<LikeButton
					liked={trackManifest?.serviceOperations?.isItemFavorited}
					onClick={() => handleAction("like")}
					disabled={!trackManifest?._id}
				/>
			)}
		</div>
	)
}

export default Controls
