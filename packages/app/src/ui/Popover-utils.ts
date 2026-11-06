import type { PopoverPosition } from "./Popover-types"

export const IMPERATIVE_GAP = 8
export const ANIMATION_DISTANCE = 4

export const POPOVER_TRANSITION = {
	duration: 0.15,
	ease: "easeOut",
} as const

export const getContentOrigin = (position: PopoverPosition) => {
	if (position === "top") return "bottom center"
	if (position === "bottom") return "top center"
	if (position === "left") return "right center"

	return "left center"
}

export const getContentMotion = (position: PopoverPosition) => {
	const hidden = {
		opacity: 0,
		scale: 0.96,
		x:
			position === "left"
				? ANIMATION_DISTANCE
				: position === "right"
					? -ANIMATION_DISTANCE
					: 0,
		y:
			position === "top"
				? ANIMATION_DISTANCE
				: position === "bottom"
					? -ANIMATION_DISTANCE
					: 0,
	}

	return {
		initial: hidden,
		animate: { opacity: 1, scale: 1, x: 0, y: 0 },
		exit: hidden,
	}
}

export const findClippingAncestor = (
	startEl: HTMLElement,
): HTMLElement | null => {
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

export const getAnchorPoint = (
	rect: DOMRect,
	position: PopoverPosition,
): { left: number; top: number } => {
	if (position === "top") {
		return {
			left: rect.left + rect.width / 2,
			top: rect.top - IMPERATIVE_GAP,
		}
	}

	if (position === "bottom") {
		return {
			left: rect.left + rect.width / 2,
			top: rect.bottom + IMPERATIVE_GAP,
		}
	}

	if (position === "left") {
		return {
			left: rect.left - IMPERATIVE_GAP,
			top: rect.top + rect.height / 2,
		}
	}

	return {
		left: rect.right + IMPERATIVE_GAP,
		top: rect.top + rect.height / 2,
	}
}

export const resolveEventRect = (
	event: React.SyntheticEvent,
): DOMRect | null => {
	const target = (event.currentTarget ?? event.target) as Element | null

	if (!target || typeof target.getBoundingClientRect !== "function") {
		return null
	}

	return target.getBoundingClientRect()
}
