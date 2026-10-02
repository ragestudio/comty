import type { JSX } from "react"
import type { StoreApi } from "zustand"
import type { ReactNode, ReactElement } from "react"

import * as z from "zustand"

class MainSheetManager {
	setState: StoreApi<MainSheetManager>["setState"]
	getState: StoreApi<MainSheetManager>["getState"]

	constructor(
		setState: StoreApi<MainSheetManager>["setState"],
		getState: StoreApi<MainSheetManager>["getState"],
	) {
		this.setState = setState
		this.getState = getState
	}

	visible: boolean = false
	content!: ReactNode

	handleOnDissmiss = (id?: string) => {
		this.setState({
			visible: false,
		})
	}

	open = (id: string, content: typeof this.content) => {
		this.setState({
			visible: true,
			content: content,
		})
	}

	close = (id?: string) => {
		this.setState({
			visible: false,
		})

		setTimeout(() => {
			this.setState({
				content: null,
			})
		}, 2000)
	}
}

export const MainSheetStore = z.create<MainSheetManager>()((set, get) => {
	return new MainSheetManager(set, get)
})

export const useMainSheetStore = () => MainSheetStore((s) => s)

export default useMainSheetStore
