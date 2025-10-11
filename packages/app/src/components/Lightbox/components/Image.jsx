import React from "react"
import classNames from "classnames"

import updateElementTransform from "@utils/updateElementTransform"

const Image = ({ src, onDragEnableChange }) => {
	const ref = React.useRef(null)

	const [loaded, setLoaded] = React.useState(false)
	const [dragEnabled, setDragEnabled] = React.useState(false)
	const [isDragging, setIsDragging] = React.useState(false)

	const zoomValue = React.useRef(1)
	const position = React.useRef({ x: 0, y: 0 })
	const dragStart = React.useRef({ x: 0, y: 0 })

	const setZoom = (value) => {
		zoomValue.current = value

		if (ref.current) {
			updateElementTransform(ref.current, "scale", zoomValue.current)
		}

		if (value > 1) {
			setDragEnabled(true)
		}

		if (value === 1) {
			setDragEnabled(false)
			setPosition(0, 0)
		}
	}

	const setPosition = (x, y) => {
		position.current = { x, y }

		if (ref.current) {
			updateElementTransform(
				ref.current,
				"translate3d",
				`${x}px, ${y}px, 0px`,
			)
		}
	}

	const handleMouseUp = React.useCallback(() => {
		setIsDragging(false)
	}, [])

	const handleMouseDown = (e) => {
		e.preventDefault()

		if (!dragEnabled) {
			return null
		}

		setIsDragging(true)

		dragStart.current = {
			x: e.clientX - position.current.x,
			y: e.clientY - position.current.y,
		}
	}

	const handleMouseMove = React.useCallback(
		(e) => {
			if (!isDragging || !dragEnabled) {
				return null
			}

			const newX = e.clientX - dragStart.current.x
			const newY = e.clientY - dragStart.current.y

			setPosition(newX, newY)
		},
		[isDragging, dragEnabled],
	)

	const handleImageLoad = () => {
		setLoaded(true)
	}

	const handleMouseScroll = React.useCallback((e) => {
		e.preventDefault()

		const delta = e.deltaY > 0 ? -0.3 : 0.3
		const newZoom = Math.max(1, Math.min(5, zoomValue.current + delta))

		setZoom(newZoom)
	}, [])

	React.useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleMouseMove)
			document.addEventListener("mouseup", handleMouseUp)

			return () => {
				document.removeEventListener("mousemove", handleMouseMove)
				document.removeEventListener("mouseup", handleMouseUp)
			}
		}
	}, [isDragging, handleMouseMove, handleMouseUp])

	React.useEffect(() => {
		const container = ref.current?.parentElement

		if (container) {
			container.addEventListener("wheel", handleMouseScroll, {
				passive: false,
			})
			return () => {
				container.removeEventListener("wheel", handleMouseScroll)
			}
		}
	}, [handleMouseScroll])

	React.useEffect(() => {
		if (typeof onDragEnableChange === "function") {
			onDragEnableChange(dragEnabled)
		}
	}, [dragEnabled])

	React.useEffect(() => {
		setPosition(0, 0)
		setZoom(1)
		setLoaded(false)
		setDragEnabled(false)
	}, [src])

	return (
		<img
			src={src}
			className={classNames("lightbox__content__media", {
				["loaded"]: loaded,
				["drag-enabled"]: dragEnabled,
				["dragging"]: isDragging,
			})}
			ref={ref}
			onLoad={handleImageLoad}
			onMouseDown={handleMouseDown}
			onDragStart={(e) => e.preventDefault()}
		/>
	)
}

export default Image
