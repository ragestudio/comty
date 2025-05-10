import React from "react"
import { Tag, Button } from "antd"
import classnames from "classnames"
import Marquee from "react-fast-marquee"

import useHideOnMouseStop from "@hooks/useHideOnMouseStop"

import { Icons } from "@components/Icons"
import Controls from "@components/Player/Controls"
import SeekBar from "@components/Player/SeekBar"
import LiveInfo from "@components/Player/LiveInfo"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

function isOverflown(element) {
	if (!element) {
		return false
	}

	return (
		element.scrollHeight > element.clientHeight ||
		element.scrollWidth > element.clientWidth
	)
}

const PlayerController = React.forwardRef((props, ref) => {
	const [playerState] = usePlayerStateContext()

	const titleRef = React.useRef()

	const [hide, onMouseEnter, onMouseLeave] = useHideOnMouseStop({
		delay: 3000,
		hideCursor: true,
	})
	const [titleIsOverflown, setTitleIsOverflown] = React.useState(false)

	const [currentTime, setCurrentTime] = React.useState(0)
	const [trackDuration, setTrackDuration] = React.useState(0)
	const [draggingTime, setDraggingTime] = React.useState(false)
	const [currentDragWidth, setCurrentDragWidth] = React.useState(0)
	const [syncInterval, setSyncInterval] = React.useState(null)

	async function onDragEnd(seekTime) {
		setDraggingTime(false)

		app.cores.player.controls.seek(seekTime)

		syncPlayback()
	}

	async function syncPlayback() {
		if (!playerState.track_manifest) {
			return false
		}

		const currentTrackTime = app.cores.player.controls.seek()

		setCurrentTime(currentTrackTime)
	}

	//* Handle when playback status change
	React.useEffect(() => {
		if (playerState.playback_status === "playing") {
			setSyncInterval(setInterval(syncPlayback, 1000))
		} else {
			if (syncInterval) {
				clearInterval(syncInterval)
			}
		}
	}, [playerState.playback_status])

	React.useEffect(() => {
		setTitleIsOverflown(isOverflown(titleRef.current))
		setTrackDuration(app.cores.player.controls.duration())
	}, [playerState.track_manifest])

	React.useEffect(() => {
		syncPlayback()
	}, [])

	const isStopped = playerState.playback_status === "stopped"

	return (
		<div
			className={classnames("lyrics-player-controller-wrapper", {
				["hidden"]: props.lyrics?.video_source && hide,
			})}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div className="lyrics-player-controller">
				<div className="lyrics-player-controller-info">
					<div className="lyrics-player-controller-info-title">
						{
							<h4
								ref={titleRef}
								className={classnames(
									"lyrics-player-controller-info-title-text",
									{
										["overflown"]: titleIsOverflown,
									},
								)}
							>
								{playerState.playback_status === "stopped" ||
									(!playerState.track_manifest?.title &&
										"Nothing is playing")}

								{playerState.playback_status !== "stopped" &&
									playerState.track_manifest?.title}
							</h4>
						}

						{titleIsOverflown && (
							<Marquee
								//gradient
								//gradientColor={bgColor}
								//gradientWidth={20}
								play={!isStopped}
							>
								<h4>
									{isStopped ? (
										"Nothing is playing"
									) : (
										<>
											{playerState.track_manifest
												?.title ?? "Untitled"}
										</>
									)}
								</h4>
							</Marquee>
						)}
					</div>

					{playerState.track_manifest?.artist && (
						<div className="lyrics-player-controller-info-details">
							<span>{playerState.track_manifest?.artist}</span>
						</div>
					)}

					{playerState.live && (
						<LiveInfo radioId={playerState.radioId} />
					)}
				</div>

				<Controls streamMode={playerState.live} />

				{!playerState.live && <SeekBar />}

				<div className="lyrics-player-controller-tags">
					{playerState.track_manifest?.metadata?.lossless && (
						<Tag
							icon={
								<Icons.Lossless
									style={{
										margin: 0,
									}}
								/>
							}
							bordered={false}
						/>
					)}
					{playerState.track_manifest?.explicit && (
						<Tag bordered={false}>Explicit</Tag>
					)}
					{props.lyrics?.sync_audio_at && (
						<Tag bordered={false} icon={<Icons.TbMovie />}>
							Video
						</Tag>
					)}
					{props.lyrics?.available_langs?.length > 1 && (
						<Button
							icon={<Icons.MdTranslate />}
							type={
								props.translationEnabled ? "primary" : "default"
							}
							onClick={() => props.toggleTranslationEnabled()}
							size="small"
						/>
					)}
				</div>
			</div>
		</div>
	)
})

export default PlayerController
