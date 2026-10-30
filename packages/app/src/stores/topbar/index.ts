import type { ReactElement } from "react"
import { create } from "zustand"

// module level state stays available before the top bar is mounted

export interface TopBarRenderOptions {
	props?: Record<string, unknown>
	className?: string
}

export interface TopBarRender {
	component: ReactElement
	options: TopBarRenderOptions
}

export interface TopBarStoreState {
	render: TopBarRender | null
	visible: boolean
	useSpacer: boolean
	setRender: (
		component: ReactElement | null,
		options?: TopBarRenderOptions,
	) => void
	clearRender: () => void
	toggleVisibility: (to?: boolean) => void
	setUseSpacer: (to: boolean) => void
}

export const useTopBarStore = create<TopBarStoreState>((set, get) => ({
	render: null,
	visible: false,
	useSpacer: true,
	setRender: (component, options = {}) => {
		set({
			render: component ? { component, options } : null,
			visible: Boolean(component),
		})
	},
	clearRender: () => {
		set({
			render: null,
			visible: false,
		})
	},
	toggleVisibility: (to) => {
		set({
			visible: typeof to === "boolean" ? to : !get().visible,
		})
	},
	setUseSpacer: (to) => {
		set({
			useSpacer: to,
		})
	},
}))

export const setTopBarRender = (
	component: ReactElement | null,
	options?: TopBarRenderOptions,
	transition = true,
) => {
	const update = () => {
		useTopBarStore.getState().setRender(component, options)
	}

	const startViewTransition =
		typeof document !== "undefined"
			? (document as any).startViewTransition
			: undefined

	if (transition && startViewTransition) {
		return startViewTransition.call(document, update)
	}

	return update()
}

export default useTopBarStore
