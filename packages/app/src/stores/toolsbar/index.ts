import * as z from "zustand"

export type AttachRenderOptions = {
	position: "top" | "bottom"
}

export type ToolRender = {
	id: string
	component: any
	props: any
}

export interface IToolsBarStore {
	visible: boolean
	renders: Record<string, ToolRender[]>
	toggleVisibility: (to?: boolean) => void
	attachRender: (
		id: string,
		component: any,
		props: any,
		options: AttachRenderOptions,
	) => ToolRender
	detachRender: (id: string) => string
	hasAnyRenders: () => boolean
}

export const toolsBarStore = z.createStore<IToolsBarStore>((set, get) => ({
	visible: false,
	renders: {
		top: [],
		bottom: [],
	},
	toggleVisibility: (to?) => {
		if (typeof to === "undefined") {
			to = !get().visible
		}

		set({
			visible: to,
		})
	},
	attachRender: (
		id,
		component,
		props,
		options = {
			position: "bottom",
		},
	) => {
		const renders = get().renders

		if (
			!renders[options.position] ||
			!Array.isArray(renders[options.position])
		) {
			throw new Error("Invalid attach render")
		}

		const render: ToolRender = {
			id: id,
			component: component,
			props: props,
		}

		renders[options.position].push(render)

		set({ renders })

		return render
	},
	detachRender: (id) => {
		const renders = get().renders

		for (let renderPositionKey of Object.keys(renders)) {
			if (
				!renders[renderPositionKey] ||
				!Array.isArray(renders[renderPositionKey])
			) {
				continue
			}

			renders[renderPositionKey] = renders[renderPositionKey].filter(
				(render) => render.id !== id,
			)
		}

		set({ renders })

		return id
	},
	hasAnyRenders: () => {
		const renders = get().renders

		for (let renderPositionKey of Object.keys(renders)) {
			if (
				!renders[renderPositionKey] ||
				!Array.isArray(renders[renderPositionKey])
			) {
				continue
			}

			if (renders[renderPositionKey].length > 0) {
				return true
			}
		}
	},
}))

export const useToolsBarStore = () => z.useStore(toolsBarStore)

export default useToolsBarStore
