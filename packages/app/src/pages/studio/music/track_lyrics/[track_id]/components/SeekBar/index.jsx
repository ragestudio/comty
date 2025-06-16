import React from "react"
import { Slider } from "antd"
import PropTypes from "prop-types"

import formatTime from "../../utils/formatTime"

const SeekBar = ({ audio, onSeek }) => {
	const [currentTime, setCurrentTime] = React.useState(0)
	const [isDragging, setIsDragging] = React.useState(false)
	const [tempProgress, setTempProgress] = React.useState(0)

	const intervalRef = React.useRef(null)

	const duration = audio.current.duration ?? 0
	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	const handleProgressStart = React.useCallback(() => {
		setIsDragging(true)
	}, [])

	const handleProgressChange = React.useCallback((value) => {
		const duration = audio.current.duration ?? 0

		setTempProgress(value)
		onSeek((value / 100) * duration)
	}, [])

	const handleProgressEnd = React.useCallback((value) => {
		const duration = audio.current.duration ?? 0

		setIsDragging(false)
		onSeek((value / 100) * duration)
	}, [])

	const updateCurrentTime = React.useCallback(() => {
		setCurrentTime(audio.current.currentTime)
	}, [])

	React.useEffect(() => {
		intervalRef.current = setInterval(updateCurrentTime, 100)

		return () => {
			clearInterval(intervalRef.current)
		}
	}, [!audio.current.paused])

	return (
		<div className="progress-container">
			<Slider
				min={0}
				max={100}
				step={0.1}
				value={isDragging ? tempProgress : progress}
				onChange={handleProgressChange}
				onChangeComplete={handleProgressEnd}
				onBeforeChange={handleProgressStart}
				tooltip={{
					formatter: (value) => {
						const time = (value / 100) * duration
						return formatTime(time)
					},
				}}
			/>
		</div>
	)
}

SeekBar.propTypes = {
	audio: PropTypes.object.isRequired,
	onSeek: PropTypes.func.isRequired,
}

export default SeekBar
