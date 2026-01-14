import React from "react"
import { Dropdown } from "antd"
import Marquee from "react-fast-marquee"

import isOverflown from "@utils/isElementOverflown"

import "./index.less"

const Timings = ({ track, currentTimingIndex }) => {
	if (!track || !track.timings) {
		return null
	}

	const [isTextOverflown, setIsTextOverflown] = React.useState(false)
	const timingsContainerRef = React.useRef()
	const currentTimingRef = React.useRef()
	const currentTiming = track.timings[currentTimingIndex]

	React.useEffect(() => {
		if (track && track.timings && currentTimingIndex !== -1) {
			setIsTextOverflown(
				isOverflown(
					timingsContainerRef.current,
					currentTimingRef.current,
				),
			)
		}
	}, [currentTimingIndex, track])

	const items = track.timings.map((timing) => {
		return {
			label: timing.label,
			key: timing.start,
			onClick: () => {
				app.cores.player.controls.seek(timing.start_ms / 1000)
			},
		}
	})

	return (
		<Dropdown
			menu={{ items: items, style: { height: 200, width: 300 } }}
			placement="top"
			trigger={["click"]}
		>
			<div
				className="player__timings-indicator"
				ref={timingsContainerRef}
			>
				{isTextOverflown && (
					<Marquee play>
						<span>{currentTiming?.label}</span>
					</Marquee>
				)}

				<span
					ref={currentTimingRef}
					style={{
						display: isTextOverflown ? "none" : "block",
					}}
				>
					{currentTiming?.label}
				</span>
			</div>
		</Dropdown>
	)
}

export default Timings
