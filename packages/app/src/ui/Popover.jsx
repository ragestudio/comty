import React from "react"
import PropTypes from "prop-types"
import classNames from "classnames"

import "./Popover.less"

const Popover = ({
	children,
	content,
	position = "top",
	trigger = "click",
	disabled = false,
	autoAdjust = true,
	className = "",
	onOpen,
	onClose,
}) => {
	const [isOpen, setIsOpen] = React.useState(false)
	const popoverRef = React.useRef(null)
	const triggerRef = React.useRef(null)
	const containerRef = React.useRef(null)
	const hoverTimeoutRef = React.useRef(null)
	const positionRef = React.useRef(position)
	const autoAdjustRef = React.useRef(autoAdjust)
	const offsetCacheRef = React.useRef({})
	const contentObserverRef = React.useRef(null)

	positionRef.current = position
	autoAdjustRef.current = autoAdjust

	const findClippingAncestor = (startEl) => {
		let ancestor = startEl.parentElement

		while (ancestor && ancestor !== document.body) {
			const style = window.getComputedStyle(ancestor)
			const overflowX = style.overflowX
			const overflowY = style.overflowY

			if (
				overflowX === "hidden" ||
				overflowX === "auto" ||
				overflowX === "scroll" ||
				overflowX === "clip" ||
				overflowY === "hidden" ||
				overflowY === "auto" ||
				overflowY === "scroll" ||
				overflowY === "clip"
			) {
				break
			}

			ancestor = ancestor.parentElement
		}

		return ancestor
	}

	const computeOffset = React.useCallback(() => {
		const popover = popoverRef.current
		const container = containerRef.current

		if (!popover || !container) return null

		popover.style.transform = ""

		const ancestor = findClippingAncestor(container)
		const clipRect = ancestor.getBoundingClientRect()
		const popoverRect = popover.getBoundingClientRect()

		const overflowLeft = Math.max(0, clipRect.left - popoverRect.left)
		const overflowRight = Math.max(0, popoverRect.right - clipRect.right)
		const overflowTop = Math.max(0, clipRect.top - popoverRect.top)
		const overflowBottom = Math.max(0, popoverRect.bottom - clipRect.bottom)

		if (
			!overflowLeft &&
			!overflowRight &&
			!overflowTop &&
			!overflowBottom
		) {
			return { offsetX: 0, offsetY: 0 }
		}

		let offsetX = 0
		let offsetY = 0

		if (overflowLeft > 0) {
			offsetX = overflowLeft
		} else if (overflowRight > 0) {
			offsetX = -overflowRight
		}

		if (overflowTop > 0) {
			offsetY = overflowTop
		} else if (overflowBottom > 0) {
			offsetY = -overflowBottom
		}

		return { offsetX, offsetY }
	}, [])

	const applyOffset = React.useCallback((offsetX, offsetY) => {
		const popover = popoverRef.current

		if (!popover) return

		const currentPosition = positionRef.current

		if (currentPosition === "top" || currentPosition === "bottom") {
			popover.style.transform = `translate(calc(-50% + ${offsetX}px), ${offsetY}px)`
		} else {
			popover.style.transform = `translate(${offsetX}px, calc(-50% + ${offsetY}px))`
		}
	}, [])

	const togglePopover = (event) => {
		if (disabled) {
			return
		}

		const newState = !isOpen
		setIsOpen(newState)

		if (newState && onOpen) {
			onOpen()
		} else if (!newState && onClose) {
			onClose()
		}
	}

	const handleClickOutside = (event) => {
		if (
			popoverRef.current &&
			!popoverRef.current.contains(event.target) &&
			triggerRef.current &&
			!triggerRef.current.contains(event.target)
		) {
			setIsOpen(false)
			if (onClose) {
				onClose()
			}
		}
	}

	const handleKeyDown = (event) => {
		if (event.key === "Escape" && isOpen) {
			setIsOpen(false)
			if (onClose) onClose()
		}
	}

	React.useLayoutEffect(() => {
		if (!autoAdjustRef.current) return

		if (!isOpen) {
			if (contentObserverRef.current) {
				contentObserverRef.current.disconnect()
				contentObserverRef.current = null
			}

			if (popoverRef.current) {
				popoverRef.current.style.transform = ""
			}

			return
		}

		const popover = popoverRef.current
		const currentPosition = positionRef.current

		const cached = offsetCacheRef.current[currentPosition]

		if (cached) {
			applyOffset(cached.offsetX, cached.offsetY)
		} else {
			const result = computeOffset()

			if (result) {
				offsetCacheRef.current[currentPosition] = result
				applyOffset(result.offsetX, result.offsetY)
			}
		}

		const contentEl = popover.querySelector(".popover-content")

		if (contentEl) {
			contentObserverRef.current = new ResizeObserver(() => {
				delete offsetCacheRef.current[currentPosition]

				const result = computeOffset()

				if (result) {
					offsetCacheRef.current[currentPosition] = result
					applyOffset(result.offsetX, result.offsetY)
				}
			})

			contentObserverRef.current.observe(contentEl)
		}

		return () => {
			if (contentObserverRef.current) {
				contentObserverRef.current.disconnect()
				contentObserverRef.current = null
			}
		}
	}, [isOpen, computeOffset, applyOffset])

	React.useEffect(() => {
		if (trigger === "click") {
			document.addEventListener("mousedown", handleClickOutside)
			document.addEventListener("keydown", handleKeyDown)
		}

		return () => {
			if (trigger === "click") {
				document.removeEventListener("mousedown", handleClickOutside)
				document.removeEventListener("keydown", handleKeyDown)
			}
			clearTimeout(hoverTimeoutRef.current)
		}
	}, [isOpen, trigger])

	const handleMouseEnter = () => {
		if (trigger === "hover" && !disabled) {
			clearTimeout(hoverTimeoutRef.current)
			setIsOpen(true)
			if (onOpen) onOpen()
		}
	}

	const handleMouseLeave = () => {
		if (trigger === "hover" && !disabled) {
			hoverTimeoutRef.current = setTimeout(() => {
				if (!popoverRef.current?.matches(":hover")) {
					setIsOpen(false)
					if (onClose) onClose()
				}
			}, 100)
		}
	}

	const handlePopoverMouseEnter = () => {
		if (trigger === "hover" && !disabled) {
			clearTimeout(hoverTimeoutRef.current)
		}
	}

	const handlePopoverMouseLeave = () => {
		if (trigger === "hover" && !disabled) {
			hoverTimeoutRef.current = setTimeout(() => {
				setIsOpen(false)
				if (onClose) onClose()
			}, 100)
		}
	}

	const eventHandlers = {
		onClick: trigger === "click" ? togglePopover : undefined,
		onMouseEnter: trigger === "hover" ? handleMouseEnter : undefined,
		onMouseLeave: trigger === "hover" ? handleMouseLeave : undefined,
	}

	const popoverEventHandlers = {
		onMouseEnter: trigger === "hover" ? handlePopoverMouseEnter : undefined,
		onMouseLeave: trigger === "hover" ? handlePopoverMouseLeave : undefined,
	}

	const contentProps = {
		close: () => setIsOpen(false),
	}

	return (
		<div
			className="popover-container"
			ref={containerRef}
		>
			<div
				ref={triggerRef}
				className={`popover-trigger ${disabled ? "disabled" : ""}`}
				{...eventHandlers}
			>
				{children}
			</div>

			{isOpen && (
				<div
					ref={popoverRef}
					className={classNames("popover", position, className, {
						["disabled"]: disabled,
					})}
					role="tooltip"
					{...popoverEventHandlers}
				>
					<div className="popover-content">
						{typeof content === "function"
							? content({ ...contentProps })
							: content}
					</div>
				</div>
			)}
		</div>
	)
}

Popover.propTypes = {
	children: PropTypes.node.isRequired,
	content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
	position: PropTypes.oneOf(["top", "bottom", "left", "right"]),
	trigger: PropTypes.oneOf(["click", "hover"]),
	disabled: PropTypes.bool,
	autoAdjust: PropTypes.bool,
	className: PropTypes.string,
	onOpen: PropTypes.func,
	onClose: PropTypes.func,
}

Popover.defaultProps = {
	position: "bottom",
	trigger: "click",
	disabled: false,
	autoAdjust: true,
	className: "",
	onOpen: null,
	onClose: null,
}

export default Popover
