import React from "react"
import PropTypes from "prop-types"
import "./Slider.less"
import classNames from "classnames"

const Slider = ({
	min = 0,
	max = 100,
	step = 1,
	value: controlledValue,
	defaultValue,
	onChange,
	onChangeComplete,
	disabled = false,
	showValue = true,
	valueFormat,
	marks = false,
	className = "",
}) => {
	const isControlled = controlledValue !== undefined
	const [internalValue, setInternalValue] = React.useState(
		defaultValue !== undefined ? defaultValue : min,
	)
	const [isDragging, setIsDragging] = React.useState(false)
	const [showValueTooltip, setShowValueTooltip] = React.useState(false)
	const [isHovering, setIsHovering] = React.useState(false)
	const sliderRef = React.useRef(null)
	const thumbRef = React.useRef(null)

	const value = isControlled ? controlledValue : internalValue

	const calculateValueFromPosition = React.useCallback(
		(clientX) => {
			if (!sliderRef.current) return min

			const rect = sliderRef.current.getBoundingClientRect()
			const position = Math.max(
				0,
				Math.min(1, (clientX - rect.left) / rect.width),
			)
			const rawValue = min + position * (max - min)
			const steppedValue = Math.round(rawValue / step) * step

			return Math.max(min, Math.min(max, steppedValue))
		},
		[min, max, step],
	)

	const handleMouseDown = React.useCallback(
		(event) => {
			if (disabled) return

			event.preventDefault()
			setIsDragging(true)
			setShowValueTooltip(true)

			const newValue = calculateValueFromPosition(event.clientX)
			if (!isControlled) {
				setInternalValue(newValue)
			}
			if (onChange) onChange(newValue)
		},
		[disabled, calculateValueFromPosition, isControlled, onChange],
	)

	const handleMouseMove = React.useCallback(
		(event) => {
			if (!isDragging || disabled) return

			const newValue = calculateValueFromPosition(event.clientX)
			if (!isControlled) {
				setInternalValue(newValue)
			}
			if (onChange) onChange(newValue)
		},
		[
			isDragging,
			disabled,
			calculateValueFromPosition,
			isControlled,
			onChange,
		],
	)

	const handleMouseUp = React.useCallback(() => {
		if (!isDragging || disabled) return

		setIsDragging(false)
		setShowValueTooltip(false)
		if (onChangeComplete) onChangeComplete(value)
	}, [isDragging, disabled, onChangeComplete, value])

	const handleClick = React.useCallback(
		(event) => {
			if (disabled) return

			const newValue = calculateValueFromPosition(event.clientX)
			if (!isControlled) {
				setInternalValue(newValue)
			}
			if (onChange) onChange(newValue)
			if (onChangeComplete) onChangeComplete(newValue)
		},
		[
			disabled,
			calculateValueFromPosition,
			isControlled,
			onChange,
			onChangeComplete,
		],
	)

	const handleKeyDown = React.useCallback(
		(event) => {
			if (disabled) return

			let newValue = value

			switch (event.key) {
				case "ArrowLeft":
				case "ArrowDown":
					newValue = Math.max(min, value - step)
					break
				case "ArrowRight":
				case "ArrowUp":
					newValue = Math.min(max, value + step)
					break
				case "Home":
					newValue = min
					break
				case "End":
					newValue = max
					break
				default:
					return
			}

			event.preventDefault()

			if (!isControlled) {
				setInternalValue(newValue)
			}
			if (onChange) onChange(newValue)
			if (onChangeComplete) onChangeComplete(newValue)
		},
		[
			disabled,
			value,
			min,
			max,
			step,
			isControlled,
			onChange,
			onChangeComplete,
		],
	)

	React.useEffect(() => {
		if (isDragging) {
			const handleGlobalMouseMove = (event) => handleMouseMove(event)
			const handleGlobalMouseUp = () => handleMouseUp()

			document.addEventListener("mousemove", handleGlobalMouseMove)
			document.addEventListener("mouseup", handleGlobalMouseUp)

			return () => {
				document.removeEventListener("mousemove", handleGlobalMouseMove)
				document.removeEventListener("mouseup", handleGlobalMouseUp)
			}
		}
	}, [isDragging, handleMouseMove, handleMouseUp])

	const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100

	const formatValue = (val) => {
		if (valueFormat) {
			if (typeof valueFormat === "function") {
				return valueFormat(val)
			}
			return valueFormat
		}
		return val
	}

	const renderMarks = () => {
		if (!marks) return null

		const markCount = max === min ? 1 : Math.floor((max - min) / step) + 1
		const marksArray = []

		for (let i = 0; i < markCount; i++) {
			const markValue = min + i * step
			const markPercentage =
				max === min ? 0 : ((markValue - min) / (max - min)) * 100
			const isActive = markValue <= value

			marksArray.push(
				<div
					key={markValue}
					className={`slider-mark ${isActive ? "active" : ""}`}
					style={{ left: `${markPercentage}%` }}
				>
					{typeof marks === "object" && marks[markValue] && (
						<div
							className={`slider-mark-label ${isActive ? "active" : ""}`}
						>
							{marks[markValue]}
						</div>
					)}
				</div>,
			)
		}

		return <div className="slider-marks">{marksArray}</div>
	}

	return (
		<div
			className={classNames(
				"slider",
				{
					disabled: disabled,
				},
				className,
			)}
			ref={sliderRef}
			onClick={handleClick}
			onMouseDown={handleMouseDown}
			onMouseEnter={() => {
				setShowValueTooltip(true)
				setIsHovering(true)
			}}
			onMouseLeave={() => {
				if (!isDragging) {
					setShowValueTooltip(false)
				}
				setIsHovering(false)
			}}
			role="slider"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-disabled={disabled}
			tabIndex={disabled ? -1 : 0}
			onKeyDown={handleKeyDown}
		>
			<div className="slider-track">
				<div
					className="slider-fill"
					style={{ width: `${percentage}%` }}
				/>
				{renderMarks()}
			</div>

			<div
				ref={thumbRef}
				className="slider-thumb"
				style={{ left: `${percentage}%` }}
				onMouseDown={handleMouseDown}
			/>

			{showValue && (
				<div
					className={`slider-value ${showValueTooltip || isDragging ? "visible" : ""}`}
					style={{ left: `${percentage}%` }}
				>
					{formatValue(value)}
				</div>
			)}
		</div>
	)
}

Slider.propTypes = {
	min: PropTypes.number,
	max: PropTypes.number,
	step: PropTypes.number,
	value: PropTypes.number,
	defaultValue: PropTypes.number,
	onChange: PropTypes.func,
	onChangeComplete: PropTypes.func,
	disabled: PropTypes.bool,
	showValue: PropTypes.bool,
	valueFormat: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	marks: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
	className: PropTypes.string,
}

Slider.defaultProps = {
	min: 0,
	max: 100,
	step: 1,
	value: undefined,
	defaultValue: undefined,
	onChange: null,
	onChangeComplete: null,
	disabled: false,
	showValue: true,
	valueFormat: null,
	marks: false,
	className: "",
}

export default Slider
