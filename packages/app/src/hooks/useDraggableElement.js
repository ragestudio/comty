import React from "react"

import updateElementTransform from "@utils/updateElementTransform"
import throttle from "@utils/throttle"

const useDraggableElement = (containerRef = null, bounds = true) => {
	const [pressed, setPressed] = React.useState(false)

	const ref = React.useRef()
	const unsubscribe = React.useRef()
	const position = React.useRef({ x: 0, y: 0 })
	const dragStart = React.useRef({ x: 0, y: 0 })
	const initialPosition = React.useRef({ x: 0, y: 0 })

	const getBounds = React.useCallback(() => {
		if (!bounds || !ref.current) return null

		const container = containerRef?.current || ref.current.parentElement
		if (!container) return null

		const containerRect = container.getBoundingClientRect()
		const elementRect = ref.current.getBoundingClientRect()

		return {
			minX: 0,
			minY: 0,
			maxX: containerRect.width - elementRect.width,
			maxY: containerRect.height - elementRect.height,
		}
	}, [containerRef, bounds])

	const constrainPosition = React.useCallback(
		(x, y) => {
			if (!bounds) return { x, y }

			const boundingRect = getBounds()
			if (!boundingRect) return { x, y }

			return {
				x: Math.max(boundingRect.minX, Math.min(boundingRect.maxX, x)),
				y: Math.max(boundingRect.minY, Math.min(boundingRect.maxY, y)),
			}
		},
		[bounds, getBounds],
	)

	const setPosition = React.useCallback(
		(x, y) => {
			const constrainedPosition = constrainPosition(x, y)

			position.current = constrainedPosition

			updateElementTransform(
				ref.current,
				"translate3d",
				`${constrainedPosition.x}px, ${constrainedPosition.y}px, 0px`,
			)
		},
		[constrainPosition],
	)

	const handleMouseDown = React.useCallback((e) => {
		e.preventDefault()
		e.stopPropagation()

		const point = e.changedTouches ? e.changedTouches[0] : e

		// Store initial mouse position
		dragStart.current = {
			x: point.clientX,
			y: point.clientY,
		}

		// Store initial element position
		initialPosition.current = { ...position.current }

		// Prevent text selection during drag
		document.body.style.userSelect = "none"
		document.body.style.webkitUserSelect = "none"

		setPressed(true)
	}, [])

	const handleMouseUp = React.useCallback((e) => {
		// Restore text selection
		document.body.style.userSelect = ""
		document.body.style.webkitUserSelect = ""

		setPressed(false)
	}, [])

	React.useEffect(() => {
		if (unsubscribe.current) {
			unsubscribe.current()
		}

		if (ref.current) {
			setPosition(0, 0)

			const handleStart = (e) => {
				// Support both mouse and touch events
				if (e.type === "mousedown" || e.type === "touchstart") {
					handleMouseDown(e)
				}
			}

			ref.current.addEventListener("mousedown", handleStart)
			ref.current.addEventListener("touchstart", handleStart, {
				passive: false,
			})

			unsubscribe.current = () => {
				if (ref.current) {
					ref.current.removeEventListener("mousedown", handleStart)
					ref.current.removeEventListener("touchstart", handleStart)
				}
			}
		}

		return () => {
			if (unsubscribe.current) {
				unsubscribe.current()
			}
		}
	}, [ref.current, handleMouseDown])

	React.useEffect(() => {
		if (!pressed) {
			return
		}

		const handleMove = throttle((event) => {
			if (
				!ref.current ||
				!dragStart.current ||
				!initialPosition.current
			) {
				return
			}

			const point = event.changedTouches ? event.changedTouches[0] : event

			// Calculate movement delta from initial mouse position
			const deltaX = point.clientX - dragStart.current.x
			const deltaY = point.clientY - dragStart.current.y

			// Apply delta to initial element position
			const newX = initialPosition.current.x + deltaX
			const newY = initialPosition.current.y + deltaY

			setPosition(newX, newY)
		}, 16) // ~60fps throttling

		const handleEnd = (e) => {
			if (e.type === "mouseup" || e.type === "touchend") {
				handleMouseUp(e)
			}
		}

		// Support both mouse and touch events
		document.addEventListener("mousemove", handleMove)
		document.addEventListener("touchmove", handleMove, { passive: false })
		document.addEventListener("mouseup", handleEnd)
		document.addEventListener("touchend", handleEnd)

		return () => {
			handleMove.cancel()

			document.removeEventListener("mousemove", handleMove)
			document.removeEventListener("touchmove", handleMove)
			document.removeEventListener("mouseup", handleEnd)
			document.removeEventListener("touchend", handleEnd)
		}
	}, [pressed, handleMouseUp, setPosition])

	// Reset position when bounds change
	React.useEffect(() => {
		if (ref.current && bounds) {
			const constrainedPosition = constrainPosition(
				position.current.x,
				position.current.y,
			)
			if (
				constrainedPosition.x !== position.current.x ||
				constrainedPosition.y !== position.current.y
			) {
				setPosition(constrainedPosition.x, constrainedPosition.y)
			}
		}
	}, [bounds, constrainPosition, setPosition])

	return {
		ref,
		pressed,
		setPosition,
		position: position.current,
	}
}

export default useDraggableElement
