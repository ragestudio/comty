import * as z from "zustand"

export type ScreenFullscreenPayload = {
	streamURL: string | null
	label: string
	hasAudio: boolean
	volume: number
	onVolume?: (value: number) => void
	onClose?: (params?: {
		payload: ScreenFullscreenManager["payload"]
		id: ScreenFullscreenManager["id"]
	}) => void
}

interface ScreenFullscreenManager {
	id: string | null
	payload: ScreenFullscreenPayload | null
	open: (id: string, payload: ScreenFullscreenPayload) => void
	close: () => void
}

export const ScreenFullscreenStore = z.create<ScreenFullscreenManager>()((
	set,
	get,
) => {
	return {
		id: null,
		payload: null,
		open(id, payload) {
			set({ id, payload })
		},
		close() {
			const state = get()

			if (!state.payload) return

			if (typeof state.payload.onClose === "function") {
				state.payload.onClose({ payload: state.payload, id: state.id })
			}

			set({ id: null, payload: null })
		},
	}
})

export const useScreenFullscreen = () => ScreenFullscreenStore((s) => s)
