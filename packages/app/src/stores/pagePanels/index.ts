import type { ComponentType } from "react"
import { create } from "zustand"

// shared slot for components attached to the active page panel

export interface PagePanelAttachOptions {
	props?: Record<string, unknown>
}

export interface PagePanelRender {
	id: string
	component: ComponentType<any>
	options: PagePanelAttachOptions
}

export interface PagePanelsStoreState {
	renders: PagePanelRender[]
	attachComponent: (
		id: string,
		component: ComponentType<any>,
		options?: PagePanelAttachOptions,
	) => void
	detachComponent: (id: string) => void
	clearComponents: () => void
}

export const usePagePanelsStore = create<PagePanelsStoreState>((set) => ({
	renders: [],
	attachComponent: (id, component, options = {}) => {
		set((state) => ({
			renders: [
				...state.renders.filter((render) => render.id !== id),
				{
					id,
					component,
					options,
				},
			],
		}))
	},
	detachComponent: (id) => {
		set((state) => ({
			renders: state.renders.filter((render) => render.id !== id),
		}))
	},
	clearComponents: () => {
		set({ renders: [] })
	},
}))

export default usePagePanelsStore
