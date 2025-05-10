import React from "react"
import { motion } from "framer-motion"

const Slider = ({
	min = 0,
	max = 100,
	step = 1,
	value,
	disabled = false,
	onChange,
	onChangeCommitted,
	valueLabelFormat,
}) => {
	const [internalValue, setInternalValue] = React.useState(value)
	const [tooltipVisible, setTooltipVisible] = React.useState(false)
	const [tooltipValue, setTooltipValue] = React.useState(value)
	const [tooltipPosition, setTooltipPosition] = React.useState(0)
	const sliderRef = React.useRef(null)

	React.useEffect(() => {
		setInternalValue(value)
	}, [value])

	const handleChange = React.useCallback(
		(event) => {
			const newValue = parseFloat(event.target.value)
			setInternalValue(newValue)
			if (onChange) {
				onChange(event, newValue)
			}
		},
		[onChange],
	)

	const handleInteractionEnd = React.useCallback(
		(event) => {
			if (onChangeCommitted) {
				onChangeCommitted(event, parseFloat(event.target.value))
			}
		},
		[onChangeCommitted],
	)

	const handleMouseMove = React.useCallback(
		(event) => {
			if (!sliderRef.current) {
				return null
			}

			const rect = sliderRef.current.getBoundingClientRect()
			const offsetX = event.clientX - rect.left
			const width = sliderRef.current.offsetWidth

			let hoverValue = min + (offsetX / width) * (max - min)
			let positionPercentage = (offsetX / width) * 100

			positionPercentage = Math.max(0, Math.min(100, positionPercentage))

			hoverValue = Math.max(min, Math.min(max, hoverValue))
			hoverValue = Math.round(hoverValue / step) * step

			if (Number.isNaN(hoverValue)) {
				hoverValue = min
			}

			if (typeof valueLabelFormat === "function") {
				setTooltipValue(valueLabelFormat(hoverValue))
			} else {
				setTooltipValue(hoverValue.toFixed(0))
			}

			setTooltipPosition(positionPercentage)
		},
		[min, max, step],
	)

	const handleMouseEnter = () => {
		if (!disabled) {
			setTooltipVisible(true)
		}
	}

	const handleMouseLeave = () => {
		setTooltipVisible(false)
	}

	const progressPercentage =
		max > min ? ((internalValue - min) / (max - min)) * 100 : 0

	return (
		<div className="slider-container">
			<div className="slider-background-track" />

			<motion.div
				className="slider-progress-track"
				initial={{ width: "0%" }}
				animate={{ width: `${progressPercentage}%` }}
				transition={{
					type: "spring",
					stiffness: 300,
					damping: 30,
					duration: 0.1,
				}}
			/>

			<input
				ref={sliderRef}
				className="slider-input"
				type="range"
				min={min}
				max={max}
				step={step}
				value={internalValue}
				disabled={disabled}
				onChange={handleChange}
				onMouseUp={handleInteractionEnd}
				onTouchEnd={handleInteractionEnd}
				onMouseMove={handleMouseMove}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				aria-valuenow={internalValue}
			/>

			{tooltipVisible && !disabled && (
				<div
					className="player-seek_bar-track-tooltip"
					style={{
						left: `calc(${tooltipPosition}% - ${tooltipPosition * 0.2}px)`,
						zIndex: 160,
					}}
				>
					{tooltipValue}
				</div>
			)}
		</div>
	)
}

export default Slider
