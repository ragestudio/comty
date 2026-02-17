import React from "react"
import PropTypes from "prop-types"
import Button from "@ui/Button"
import Popover from "@ui/Popover"

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

	const onPlayerStateChange = React.useCallback(() => {
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
			<Button
				type="ghost"
				icon={<Icons.ChevronLeft />}
				onClick={() => handleAction("previous")}
				disabled={props.streamMode}
			/>
			<Button
				className="playButton"
				type="primary"
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
			>
				{playerState.loading && (
					<div className="loadCircle">
						<UseAnimations
							animation={LoadingAnimation}
							size="100%"
						/>
					</div>
				)}
			</Button>
			<Button
				type="ghost"
				icon={<Icons.ChevronRight />}
				onClick={() => handleAction("next")}
				disabled={props.streamMode}
			/>
			{!app.isMobile && (
				<Popover
					trigger="hover"
					content={React.createElement(AudioVolume, {
						onChange: (value) => handleAction("volume", value),
						defaultValue: playerState.volume,
					})}
				>
					<Button
						type="ghost"
						className="muteButton"
						onClick={() => handleAction("mute")}
					>
						{playerState.muted ? (
							<Icons.VolumeX />
						) : (
							<Icons.Volume2 />
						)}
					</Button>
				</Popover>
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

Controls.propTypes = {
	className: PropTypes.string,
	streamMode: PropTypes.bool,
}

Controls.defaultProps = {
	className: null,
	streamMode: false,
}

export default Controls
