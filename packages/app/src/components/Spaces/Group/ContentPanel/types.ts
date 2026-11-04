import { type ComponentType, type ReactNode } from "react"

export type ContentKey = "chat" | "channel" | "settings"

export interface ContentComponentProps<TContext = any> {
	_id?: string
	contextData?: TContext
}

export interface ContentDefinition<TContext = any> {
	title: string
	description?: string
	icon?: ComponentType<{ className?: string }>
	component: ComponentType<ContentComponentProps<TContext>>
	defaultHeaderVisible?: boolean
}

export interface ContentHeaderState {
	title?: string
	description?: string
	icon?: ComponentType<{ className?: string }>
	visible: boolean
	extraContent?: ReactNode
}

export type HeaderOverrides = Partial<ContentHeaderState>
