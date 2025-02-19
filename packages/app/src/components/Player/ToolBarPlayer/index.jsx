import React from "react"
import * as antd from "antd"
import Marquee from "react-fast-marquee"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import { usePlayerStateContext } from "@contexts/WithPlayerContext"
import LiveInfo from "@components/Player/LiveInfo"
import SeekBar from "@components/Player/SeekBar"
import Controls from "@components/Player/Controls"

import RGBStringToValues from "@utils/rgbToValues"

import ExtraActions from "../ExtraActions"

import "./index.less"

function isOverflown(parent, element) {
	if (!parent || !element) {
		return false
	}

	const parentRect = parent.getBoundingClientRect()
	const elementRect = element.getBoundingClientRect()

	return elementRect.width > parentRect.width
}

const Indicators = ({ track, playerState }) => {
	if (!track) {
		return null
	}

	const indicators = []

	if (track.metadata) {
		if (track.metadata.lossless) {
			indicators.push(<Icons.Lossless />)
		}
	}

	if (playerState.live) {
		indicators.push(
			<Icons.FiRadio style={{ color: "var(--colorPrimary)" }} />,
		)
	}

	if (indicators.length === 0) {
		return null
	}

	return (
		<div className="toolbar_player_indicators_wrapper">
			<div className="toolbar_player_indicators">{indicators}</div>
		</div>
	)
}

const ServiceIndicator = (props) => {
	if (!props.service) {
		return null
	}

	switch (props.service) {
		case "tidal": {
			return (
				<div className="service_indicator">
					<Icons.SiTidal />
				</div>
			)
		}
		default: {
			return null
		}
	}
}

const Player = (props) => {
	const [playerState] = usePlayerStateContext()

	const contentRef = React.useRef()
	const titleRef = React.useRef()

	const [topActionsVisible, setTopActionsVisible] = React.useState(false)
	const [titleOverflown, setTitleOverflown] = React.useState(false)
	const [coverAnalysis, setCoverAnalysis] = React.useState(null)

	const handleOnMouseInteraction = (e) => {
		if (e.type === "mouseenter") {
			setTopActionsVisible(true)
		} else {
			setTopActionsVisible(false)
		}
	}

	const { title, artistStr, service, cover_analysis, cover } =
		playerState.track_manifest ?? {}

	const playing = playerState.playback_status === "playing"
	const stopped = playerState.playback_status === "stopped"

	const titleText = !playing && stopped ? "Stopped" : (title ?? "Untitled")
	const subtitleText = ""

	React.useEffect(() => {
		const titleIsOverflown = isOverflown(
			contentRef.current,
			titleRef.current,
		)

		setTitleOverflown(titleIsOverflown)
	}, [title])

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

	return (
		<div
			className={classnames("toolbar_player_wrapper", {
				hover: topActionsVisible,
				minimized: playerState.minimized,
				cover_light: coverAnalysis?.isLight,
			})}
			style={{
				"--cover_averageValues": RGBStringToValues(
					coverAnalysis?.rgb ?? "0,0,0",
				),
				"--cover_isLight": coverAnalysis?.isLight ?? false,
			}}
			onMouseEnter={handleOnMouseInteraction}
			onMouseLeave={handleOnMouseInteraction}
		>
			<div className={classnames("toolbar_player_top_actions")}>
				{!playerState.control_locked && (
					<antd.Button icon={<Icons.MdCast />} shape="circle" />
				)}

				<antd.Button
					icon={<Icons.MdFullscreen />}
					shape="circle"
					onClick={() => app.location.push("/lyrics")}
				/>

				<antd.Button
					icon={<Icons.FiX />}
					shape="circle"
					onClick={() => app.cores.player.close()}
				/>
			</div>
			<div className={classnames("toolbar_player")}>
				<div
					className="toolbar_cover_background"
					style={{
						backgroundImage: `url(${cover})`,
					}}
				/>

				<div className="toolbar_player_content" ref={contentRef}>
					<div className="toolbar_player_info">
						<h1
							ref={titleRef}
							className={classnames("toolbar_player_info_title", {
								["overflown"]: titleOverflown,
							})}
						>
							<ServiceIndicator service={service} />

							{titleText}
						</h1>

						{titleOverflown && (
							<Marquee
								gradientColor={RGBStringToValues(
									coverAnalysis?.rgb ?? "0,0,0",
								)}
								gradientWidth={20}
								play={playerState.playback_status !== "stopped"}
							>
								<h1 className="toolbar_player_info_title">
									<ServiceIndicator service={service} />

									{titleText}
								</h1>
							</Marquee>
						)}

						<p className="toolbar_player_info_subtitle">
							{artistStr ?? ""}
						</p>
					</div>

					{playerState.radioId && (
						<LiveInfo radioId={playerState.radioId} />
					)}

					<div className="toolbar_player_actions">
						<Controls streamMode={playerState.live} />

						<SeekBar
							stopped={playerState.playback_status === "stopped"}
							playing={playerState.playback_status === "playing"}
							streamMode={playerState.live}
						/>

						<ExtraActions streamMode={playerState.live} />
					</div>

					<Indicators
						track={playerState.track_manifest}
						playerState={playerState}
					/>
				</div>
			</div>
		</div>
	)
}

export default Player
