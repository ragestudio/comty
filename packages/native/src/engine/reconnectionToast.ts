import * as z from "zustand"
import { useToast } from "panelui-native"

const { toast } = useToast()

interface reconnectionToastStoreType {
	currentToastId: string | null
	open: () => void
	close: () => void
}

export const reconnectionToastStore = z.create<reconnectionToastStoreType>(
	(set, get) => ({
		currentToastId: null,
		open: () => {
			const state = get()

			if (!state.currentToastId) {
				const id = toast.show({
					variant: "destructive",
					placement: "top",
					label: "Reconnecting",
					closable: false,
					duration: 0,
				})

				set({
					currentToastId: id,
				})
			}
		},
		close: () => {
			const state = get()

			if (state.currentToastId) {
				toast.hide(state.currentToastId)
				set({ currentToastId: null })

				toast.show({
					variant: "success",
					placement: "top",
					label: "Reconected",
					closable: false,
					duration: 2000,
				})
			}
		},
	}),
)

export default reconnectionToastStore
