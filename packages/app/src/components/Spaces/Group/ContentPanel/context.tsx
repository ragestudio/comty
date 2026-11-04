import React, { type ReactNode } from "react"

import type {
	ContentKey,
	ContentDefinition,
	ContentHeaderState,
	HeaderOverrides,
} from "./types"

import { CONTENT_REGISTRY } from "./registry"

interface ContentContextValue<TContext = any> {
	type: ContentKey | null
	definition: ContentDefinition<TContext> | null
	contextData: TContext | null
	header: ContentHeaderState
	setHeader: (overrides: HeaderOverrides) => void
	setTitle: (title: string) => void
	setIcon: (icon: ContentHeaderState["icon"]) => void
	setHeaderVisible: (visible: boolean) => void
	setHeaderContent: (content: ReactNode) => void
	resetHeader: () => void
}

const ContentContext = React.createContext<ContentContextValue | null>(null)

interface ContentProviderProps<TContext> {
	type: ContentKey | null
	contextData?: TContext | null
	children: ReactNode
}

export function ContentProvider<TContext = any>({
	type,
	contextData = null,
	children,
}: ContentProviderProps<TContext>) {
	const definition = type ? CONTENT_REGISTRY[type] : null
	const [overrides, setOverrides] = React.useState<HeaderOverrides>({})

	React.useEffect(() => {
		setOverrides({})
	}, [type, (contextData as any)?._id])

	const header = React.useMemo<ContentHeaderState>(() => {
		const baseTitle = (contextData as any)?.name ?? definition?.title ?? ""
		const baseDescription =
			(contextData as any)?.description ?? definition?.description
		const baseIcon = definition?.icon
		const baseVisible = definition?.defaultHeaderVisible ?? true

		return {
			title: overrides.title ?? baseTitle,
			description: overrides.description ?? baseDescription,
			icon: overrides.icon ?? baseIcon,
			visible: overrides.visible ?? baseVisible,
			extraContent: overrides.extraContent,
		}
	}, [definition, contextData, overrides])

	const setHeader = React.useCallback((newOverrides: HeaderOverrides) => {
		setOverrides((prev) => ({ ...prev, ...newOverrides }))
	}, [])

	const setTitle = React.useCallback((title: string) => {
		setOverrides((prev) => ({ ...prev, title }))
	}, [])

	const setIcon = React.useCallback((icon: ContentHeaderState["icon"]) => {
		setOverrides((prev) => ({ ...prev, icon }))
	}, [])

	const setHeaderVisible = React.useCallback((visible: boolean) => {
		setOverrides((prev) => ({ ...prev, visible }))
	}, [])

	const setHeaderContent = React.useCallback((extraContent: ReactNode) => {
		setOverrides((prev) => ({ ...prev, extraContent }))
	}, [])

	const resetHeader = React.useCallback(() => {
		setOverrides({})
	}, [])

	const value = React.useMemo(
		() => ({
			type,
			definition,
			contextData,
			header,
			setHeader,
			setTitle,
			setIcon,
			setHeaderVisible,
			setHeaderContent,
			resetHeader,
		}),
		[
			type,
			definition,
			contextData,
			header,
			setHeader,
			setTitle,
			setIcon,
			setHeaderVisible,
			setHeaderContent,
			resetHeader,
		],
	)

	return (
		<ContentContext.Provider value={value}>{children}</ContentContext.Provider>
	)
}

export const useContentContext = <TContext = any,>() => {
	const ctx = React.useContext(ContentContext)

	if (!ctx) {
		throw new Error("useContentContext must be used within a ContentProvider")
	}

	return ctx as ContentContextValue<TContext>
}

export const useContentLayout = () => {
	const {
		header,
		setHeader,
		setTitle,
		setIcon,
		setHeaderVisible,
		setHeaderContent,
		resetHeader,
	} = useContentContext()

	return {
		header,
		setHeader,
		setTitle,
		setIcon,
		setHeaderVisible,
		setHeaderContent,
		resetHeader,
	}
}
