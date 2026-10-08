import * as z from "zustand"

export type ScreenFullscreenPayload = {
	streamURL: string | null
	label: string
	hasAudio: boolean
	volume: number
	onVolume?: (value: number) => void
	onClose: () => void
}

interface ScreenFullscreenManager {
	payload: ScreenFullscreenPayload | null
}

export const ScreenFullscreenStore = z.create<ScreenFullscreenManager>()((
	set,
	get,
) => {
	return {
		payload: null,
		open(payload: ScreenFullscreenPayload) {
			set({ payload })
		},
		close() {
			if (get().payload === null) return
			set({ payload: null })
		},
	}
})

export const useScreenFullscreen = () => ScreenFullscreenStore((s) => s)
