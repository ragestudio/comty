import React from "react"
import PropTypes from "prop-types"
import formatTime from "../../utils/formatTime"

const TimeIndicators = ({ audio }) => {
	const [currentTime, setCurrentTime] = React.useState(0)
	const frameId = React.useRef(null)

	const timeTick = React.useCallback(() => {
		setCurrentTime(audio.current.currentTime)
		frameId.current = requestAnimationFrame(timeTick)
	}, [])

	React.useEffect(() => {
		console.log("starting frame")
		timeTick()

		return () => {
			if (frameId.current) {
				console.log("canceling frame")
				cancelAnimationFrame(frameId.current)
			}
		}
	}, [])

	return (
		<>
			{formatTime(currentTime)} / {formatTime(audio.current.duration)}
		</>
	)
}

TimeIndicators.propTypes = {
	audio: PropTypes.object.isRequired,
}

export default TimeIndicators
