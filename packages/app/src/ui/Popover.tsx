import type {
	ImperativeListener,
	ImperativePopoverState,
	PopoverComponent,
	PopoverContentProps,
	PopoverOffset,
	PopoverOpenOptions,
	PopoverPosition,
	PopoverProps,
	PopoverRect,
} from "./Popover-types"

import React from "react"
import { createPortal } from "react-dom"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"

import {
	findClippingAncestor,
	getAnchorPoint,
	getContentMotion,
	getContentOrigin,
	POPOVER_TRANSITION,
	resolveEventRect,
} from "./Popover-utils"

import "./Popover.less"

let imperativeState: ImperativePopoverState | null = null
let imperativeActive = false
let imperativeOnClose: (() => void) | null = null

const imperativeListeners = new Set<ImperativeListener>()

const subscribeImperative = (listener: ImperativeListener) => {
	imperativeListeners.add(listener)

	return () => {
		imperativeListeners.delete(listener)
	}
}

const getImperativeSnapshot = () => imperativeState

const emitImperative = () => {
	for (const listener of imperativeListeners) {
		listener()
	}
}

const takeImperativeOnClose = () => {
	imperativeActive = false
	const onClose = imperativeOnClose
	imperativeOnClose = null

	return onClose
}

const closeImperative = () => {
	if (!imperativeActive) return

	const onClose = takeImperativeOnClose()
	imperativeState = null

	emitImperative()
	onClose?.()
}

const disposeImperative = () => {
	if (!imperativeActive) return

	const onClose = takeImperativeOnClose()
	imperativeState = null

	onClose?.()
}

const Popover = (({
	children,
	content,
	contentProps = {},
	position = "top",
	trigger = "click",
	disabled = false,
	autoAdjust = true,
	portal = false,
	className = "",
	onOpen,
	onClose,
	anchorRect,
}: PopoverProps) => {
	const isImperative = Boolean(anchorRect)
	const isPortal = portal && !isImperative

	const [isOpen, setIsOpen] = React.useState(isImperative)
	const [portalRect, setPortalRect] = React.useState<PopoverRect | null>(null)
	const popoverRef = React.useRef<HTMLDivElement>(null)
	const triggerRef = React.useRef<HTMLDivElement>(null)
	const containerRef = React.useRef<HTMLDivElement>(null)
	const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	)
	const positionRef = React.useRef(position)
	const autoAdjustRef = React.useRef(autoAdjust)
	const offsetCacheRef = React.useRef<
		Partial<Record<PopoverPosition, PopoverOffset>>
	>({})
	const contentObserverRef = React.useRef<ResizeObserver | null>(null)

	positionRef.current = position
	autoAdjustRef.current = autoAdjust

	const getBoundaryRect = React.useCallback((): PopoverRect => {
		if (isImperative || isPortal) {
			return {
				left: 0,
				top: 0,
				right: window.innerWidth,
				bottom: window.innerHeight,
			}
		}

		const container = containerRef.current
		const ancestor = container
			? (findClippingAncestor(container) ?? document.body)
			: document.body

		return ancestor.getBoundingClientRect()
	}, [isImperative, isPortal])

	const computeOffset = React.useCallback((): PopoverOffset | null => {
		const popover = popoverRef.current

		if (!popover) return null

		popover.style.transform = ""

		const boundaryRect = getBoundaryRect()
		const popoverRect = popover.getBoundingClientRect()

		const overflowLeft = Math.max(0, boundaryRect.left - popoverRect.left)
		const overflowRight = Math.max(
			0,
			popoverRect.right - boundaryRect.right,
		)
		const overflowTop = Math.max(0, boundaryRect.top - popoverRect.top)
		const overflowBottom = Math.max(
			0,
			popoverRect.bottom - boundaryRect.bottom,
		)

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
	}, [getBoundaryRect])

	const applyOffset = React.useCallback(
		(offsetX: number, offsetY: number) => {
			const popover = popoverRef.current

			if (!popover) return

			const currentPosition = positionRef.current

			if (currentPosition === "top" || currentPosition === "bottom") {
				popover.style.transform = `translate(calc(-50% + ${offsetX}px), ${offsetY}px)`
			} else {
				popover.style.transform = `translate(${offsetX}px, calc(-50% + ${offsetY}px))`
			}
		},
		[],
	)

	const updatePortalRect = React.useCallback(() => {
		const trigger = triggerRef.current

		if (!trigger) return

		const rect = trigger.getBoundingClientRect()

		setPortalRect((previous) => {
			if (
				previous &&
				previous.left === rect.left &&
				previous.top === rect.top &&
				previous.right === rect.right &&
				previous.bottom === rect.bottom
			) {
				return previous
			}

			return {
				left: rect.left,
				top: rect.top,
				right: rect.right,
				bottom: rect.bottom,
			}
		})
	}, [])

	const openPopover = () => {
		if (isImperative) return

		if (isPortal) updatePortalRect()

		setIsOpen(true)
		if (onOpen) onOpen()
	}

	const closePopover = () => {
		if (isImperative) {
			closeImperative()
			return
		}

		setIsOpen(false)
		if (onClose) onClose()
	}

	const togglePopover = () => {
		if (disabled || isImperative) return

		if (isOpen) {
			closePopover()
		} else {
			openPopover()
		}
	}

	const handleClickOutside = (event: MouseEvent) => {
		const popover = popoverRef.current

		if (!popover) return
		if (popover.contains(event.target as Node)) return
		if (triggerRef.current?.contains(event.target as Node)) return

		if (isImperative) {
			closeImperative()
			return
		}

		if (!isOpen) return

		closePopover()
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key !== "Escape") return

		if (isImperative) {
			closeImperative()
			return
		}

		if (isOpen) {
			closePopover()
		}
	}

	React.useEffect(() => {
		if (!isPortal || !isOpen) return

		updatePortalRect()

		window.addEventListener("resize", updatePortalRect)
		window.addEventListener("scroll", updatePortalRect, true)

		return () => {
			window.removeEventListener("resize", updatePortalRect)
			window.removeEventListener("scroll", updatePortalRect, true)
		}
	}, [isPortal, isOpen, updatePortalRect])

	React.useLayoutEffect(() => {
		if (!autoAdjustRef.current) return

		if (!isImperative && !isOpen) {
			if (contentObserverRef.current) {
				contentObserverRef.current.disconnect()
				contentObserverRef.current = null
			}

			return
		}

		const popover = popoverRef.current

		if (!popover) return

		const currentPosition = positionRef.current
		const useCache = !isImperative && !isPortal
		const cached = useCache
			? offsetCacheRef.current[currentPosition]
			: undefined

		if (cached) {
			applyOffset(cached.offsetX, cached.offsetY)
		} else {
			const result = computeOffset()

			if (result) {
				if (useCache) {
					offsetCacheRef.current[currentPosition] = result
				}

				applyOffset(result.offsetX, result.offsetY)
			}
		}

		const contentEl = popover.querySelector(".popover-content")

		if (contentEl) {
			contentObserverRef.current = new ResizeObserver(() => {
				if (useCache) {
					delete offsetCacheRef.current[currentPosition]
				}

				const result = computeOffset()

				if (result) {
					if (useCache) {
						offsetCacheRef.current[currentPosition] = result
					}

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
	}, [
		isImperative,
		isPortal,
		isOpen,
		anchorRect,
		portalRect,
		position,
		computeOffset,
		applyOffset,
	])

	React.useEffect(() => {
		const listen = isImperative || trigger === "click"

		if (listen) {
			document.addEventListener("mousedown", handleClickOutside)
			document.addEventListener("keydown", handleKeyDown)
		}

		return () => {
			if (listen) {
				document.removeEventListener("mousedown", handleClickOutside)
				document.removeEventListener("keydown", handleKeyDown)
			}

			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current)
			}
		}
	}, [isImperative, isOpen, trigger])

	const handleMouseEnter = () => {
		if (trigger === "hover" && !disabled && !isImperative) {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current)
			}

			openPopover()
		}
	}

	const handleMouseLeave = () => {
		if (trigger === "hover" && !disabled && !isImperative) {
			hoverTimeoutRef.current = setTimeout(() => {
				if (!popoverRef.current?.matches(":hover")) {
					closePopover()
				}
			}, 100)
		}
	}

	const handlePopoverMouseEnter = () => {
		if (trigger === "hover" && !disabled && !isImperative) {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current)
			}
		}
	}

	const handlePopoverMouseLeave = () => {
		if (trigger === "hover" && !disabled && !isImperative) {
			hoverTimeoutRef.current = setTimeout(() => {
				closePopover()
			}, 100)
		}
	}

	const eventHandlers: React.HTMLAttributes<HTMLDivElement> = {
		onClick: trigger === "click" ? togglePopover : undefined,
		onMouseEnter: trigger === "hover" ? handleMouseEnter : undefined,
		onMouseLeave: trigger === "hover" ? handleMouseLeave : undefined,
	}

	const popoverEventHandlers: Pick<
		React.HTMLAttributes<HTMLDivElement>,
		"onMouseEnter" | "onMouseLeave"
	> = {
		onMouseEnter: trigger === "hover" ? handlePopoverMouseEnter : undefined,
		onMouseLeave: trigger === "hover" ? handlePopoverMouseLeave : undefined,
	}

	const closeContent = () => {
		if (isImperative) {
			closeImperative()
			return
		}

		setIsOpen(false)
	}

	const contentPropsFinal: PopoverContentProps = {
		close: closeContent,
		...contentProps,
	}

	const contentMotion = getContentMotion(position)
	const anchorPoint = anchorRect ? getAnchorPoint(anchorRect, position) : null

	const panel = (
		<motion.div
			ref={popoverRef}
			className={classNames("popover", position, className, {
				["disabled"]: disabled,
			})}
			role="tooltip"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={POPOVER_TRANSITION}
			{...popoverEventHandlers}
		>
			<motion.div
				className={classNames(
					"popover-content",
					"bg-accent",
					"border-default",
				)}
				style={{ transformOrigin: getContentOrigin(position) }}
				{...contentMotion}
				transition={POPOVER_TRANSITION}
			>
				{typeof content === "function"
					? content({ ...contentPropsFinal })
					: content}
			</motion.div>
		</motion.div>
	)

	if (anchorPoint) {
		return (
			<div
				className="popover-imperative"
				style={{
					left: anchorPoint.left,
					top: anchorPoint.top,
				}}
			>
				{panel}
			</div>
		)
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

			{isPortal ? (
				portalRect &&
				isOpen &&
				createPortal(
					<div
						className="popover-portal"
						style={{
							left: portalRect.left,
							top: portalRect.top,
							width: portalRect.right - portalRect.left,
							height: portalRect.bottom - portalRect.top,
						}}
					>
						{panel}
					</div>,
					document.body,
				)
			) : (
				<AnimatePresence>{isOpen && panel}</AnimatePresence>
			)}
		</div>
	)
}) as PopoverComponent

export const PopoverHost = () => {
	const state = React.useSyncExternalStore(
		subscribeImperative,
		getImperativeSnapshot,
		getImperativeSnapshot,
	)

	React.useEffect(() => {
		return () => {
			disposeImperative()
		}
	}, [])

	return (
		<AnimatePresence>
			{state && (
				<Popover
					anchorRect={state.anchorRect}
					content={state.options.content}
					contentProps={state.options.contentProps}
					position={state.options.position}
					autoAdjust={state.options.autoAdjust}
					className={state.options.className}
				/>
			)}
		</AnimatePresence>
	)
}

const openImperative = (
	event: React.SyntheticEvent,
	options: PopoverOpenOptions,
) => {
	const anchorRect = resolveEventRect(event)

	if (!anchorRect) {
		return () => {}
	}

	if (imperativeActive) {
		takeImperativeOnClose()?.()
	}

	const state: ImperativePopoverState = { anchorRect, options }

	imperativeActive = true
	imperativeOnClose = options.onClose ?? null
	imperativeState = state

	emitImperative()

	return () => {
		if (imperativeState !== state) return

		closeImperative()
	}
}

Popover.open = openImperative
Popover.close = closeImperative

export default Popover
