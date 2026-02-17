import React from "react"
import PropTypes from "prop-types"

import "./Popover.less"

const Popover = ({
	children,
	content,
	position = "top",
	trigger = "click",
	disabled = false,
	className = "",
	onOpen,
	onClose,
}) => {
	const [isOpen, setIsOpen] = React.useState(false)
	const popoverRef = React.useRef(null)
	const triggerRef = React.useRef(null)
	const containerRef = React.useRef(null)
	const hoverTimeoutRef = React.useRef(null)

	const togglePopover = () => {
		if (disabled) return

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
			if (onClose) onClose()
		}
	}

	const handleKeyDown = (event) => {
		if (event.key === "Escape" && isOpen) {
			setIsOpen(false)
			if (onClose) onClose()
		}
	}

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
					className={`popover ${position} ${className} ${disabled ? "disabled" : ""}`}
					role="tooltip"
					{...popoverEventHandlers}
				>
					<div className="popover-content">
						{typeof content === "function" ? content() : content}
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
	className: PropTypes.string,
	onOpen: PropTypes.func,
	onClose: PropTypes.func,
}

Popover.defaultProps = {
	position: "bottom",
	trigger: "click",
	disabled: false,
	className: "",
	onOpen: null,
	onClose: null,
}

export default Popover
