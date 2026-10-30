import type { ReactElement } from "react"
import { create } from "zustand"

// module level state stays available before the header is mounted

export interface HeaderRenderOptions {
	props?: Record<string, unknown>
}

export interface HeaderRender {
	component: ReactElement
	options: HeaderRenderOptions
}

export interface HeaderStoreState {
	render: HeaderRender | null
	setRender: (
		component: ReactElement | null,
		options?: HeaderRenderOptions,
	) => void
}

export const useHeaderStore = create<HeaderStoreState>((set) => ({
	render: null,
	setRender: (component, options = {}) => {
		set({
			render: component ? { component, options } : null,
		})
	},
}))

export default useHeaderStore
