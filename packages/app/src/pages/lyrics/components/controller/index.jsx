import React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Tag, Button } from "antd"
import classnames from "classnames"
import Marquee from "react-fast-marquee"

import { Icons } from "@components/Icons"
import Controls from "@components/Player/Controls"
import Indicators from "@components/Player/Indicators"
import SeekBar from "@components/Player/SeekBar"
import LiveInfo from "@components/Player/LiveInfo"

import useHideOnMouseStop from "@hooks/useHideOnMouseStop"
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

const PlayerController = (props) => {
	const [playerState] = usePlayerStateContext()

	const titleRef = React.useRef()

	const [hide, onMouseEnter, onMouseLeave, isHovered] = useHideOnMouseStop({
		delay: 3000,
		hideCursor: true,
	})
	const [titleIsOverflown, setTitleIsOverflown] = React.useState(false)

	React.useEffect(() => {
		setTitleIsOverflown(isOverflown(titleRef.current))
	}, [playerState.track_manifest])

	if (playerState.playback_status === "stopped") {
		return null
	}

	return (
		<div
			className={classnames("lyrics-player-controller-wrapper", {
				["hidden"]: props.lyrics?.video_source && hide,
			})}
		>
			<div
				className="lyrics-player-controller bg-accent"
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
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
								{playerState.track_manifest?.title}
							</h4>
						}

						{titleIsOverflown && (
							<Marquee
								//gradient
								//gradientColor={bgColor}
								//gradientWidth={20}
								play={playerState.playback_status === "playing"}
							>
								<h4>
									{playerState.track_manifest?.title ??
										"Untitled"}
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

				<AnimatePresence>
					{isHovered && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 30 }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.15 }}
							className="lyrics-player-controller-controls"
						>
							<Controls streamMode={playerState.live} />
						</motion.div>
					)}
				</AnimatePresence>

				{!playerState.live && <SeekBar />}

				{/* <Indicators
					track={playerState.track_manifest}
					playerState={playerState}
				/>*/}
			</div>
		</div>
	)
}

export default PlayerController
