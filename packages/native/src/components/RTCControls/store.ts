import * as z from "zustand"

interface RTCControlsManager {
	expanded: boolean
	setExpanded: (to: boolean) => void
	toggle: (to: boolean) => void
}

export const RTCControlsStore = z.create<RTCControlsManager>()((set, get) => {
	return {
		expanded: false,
		setExpanded(to: boolean) {
			set({ expanded: to })
		},
		toggle() {
			set((prev) => {
				prev.expanded = !prev.expanded
				return prev
			})
		},
	}
})

export const useRTCControls = () => RTCControlsStore((s) => s)

export default useRTCControls
