import React from "react"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import SeekBar from "@components/Player/SeekBar"
import Controls from "@components/Player/Controls"
import Actions from "@components/Player/Actions"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"
import RGBStringToValues from "@utils/rgbToValues"

import "./index.less"

const ServiceIndicator = (props) => {
	if (!props.service) {
		return null
	}

	switch (props.service) {
		case "tidal": {
			return (
				<div className="service_indicator">
					<Icons.SiTidal /> Playing from Tidal
				</div>
			)
		}
		default: {
			return null
		}
	}
}

const AudioPlayer = (props) => {
	const [playerState] = usePlayerStateContext()

	React.useEffect(() => {
		if (app.currentDragger) {
			app.currentDragger.setBackgroundColorValues(
				RGBStringToValues(
					playerState.track_manifest?.cover_analysis?.rgb,
				),
			)
		}
	}, [playerState.track_manifest?.cover_analysis])

	const {
		title,
		album,
		artist,
		service,
		lyricsEnabled,
		cover_analysis,
		cover,
	} = playerState.track_manifest ?? {}

	const playing = playerState.playback_status === "playing"
	const stopped = playerState.playback_status === "stopped"

	const titleText = !playing && stopped ? "Stopped" : (title ?? "Untitled")
	const subtitleText = `${artist} | ${album?.title ?? album}`

	return (
		<div
			className={classnames("mobile-player_wrapper", {
				cover_light: cover_analysis?.isLight,
			})}
			style={{
				"--cover_isLight": cover_analysis?.isLight,
			}}
		>
			<div className="mobile-player">
				<ServiceIndicator service={service} />

				<div
					className="mobile-player-cover"
					style={{
						backgroundImage: `url(${cover ?? "/assets/no_song.png"})`,
					}}
				/>

				<div className="mobile-player-header">
					<div className="mobile-player-info">
						<div className="mobile-player-info-title">
							<h1>{titleText}</h1>
						</div>
						<div className="mobile-player-info-subTitle">
							<span>{subtitleText}</span>
						</div>
					</div>
				</div>

				<Controls />

				<SeekBar
					stopped={playerState.playback_status === "stopped"}
					playing={playerState.playback_status === "playing"}
					streamMode={playerState.livestream_mode}
					disabled={playerState.control_locked}
				/>

				<Actions />
			</div>
		</div>
	)
}

export default AudioPlayer
