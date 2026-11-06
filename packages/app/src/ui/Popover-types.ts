import type React from "react"

export type PopoverPosition = "top" | "bottom" | "left" | "right"
export type PopoverTrigger = "click" | "hover"

export interface PopoverContentProps {
	close: () => void
	[key: string]: any
}

export type PopoverContent = React.ReactNode | ((props: any) => React.ReactNode)

export interface PopoverProps {
	children?: React.ReactNode
	content: PopoverContent
	contentProps?: Record<string, any>
	position?: PopoverPosition
	trigger?: PopoverTrigger
	disabled?: boolean
	autoAdjust?: boolean
	className?: string
	onOpen?: () => void
	onClose?: () => void
	// when set, the popover renders imperative anchored to this rect
	anchorRect?: DOMRect
}

export interface PopoverOpenOptions {
	content: PopoverContent
	contentProps?: Record<string, any>
	position?: PopoverPosition
	autoAdjust?: boolean
	className?: string
	// called once when the popover close starts
	onClose?: () => void
}

export type PopoverCloseHandler = () => void

export interface PopoverComponent extends React.FC<PopoverProps> {
	open: (
		event: React.SyntheticEvent,
		options: PopoverOpenOptions,
	) => PopoverCloseHandler
	close: () => void
}

export interface PopoverOffset {
	offsetX: number
	offsetY: number
}

export interface PopoverRect {
	left: number
	top: number
	right: number
	bottom: number
}

export interface ImperativePopoverState {
	anchorRect: DOMRect
	options: PopoverOpenOptions
}

export type ImperativeListener = () => void
