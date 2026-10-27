import type { AudioDevicesEvents } from "@/adapter"

// the input device chosen by the user, shared between routing and capture so
// getUserMedia starts on the right device
let selectedInputDeviceId: string | null = null

export function getSelectedInputDeviceId(): string | null {
	return selectedInputDeviceId
}

export function setSelectedInputDeviceId(deviceId: string | null) {
	selectedInputDeviceId = deviceId
}

export const webAudioDevicesEvents: AudioDevicesEvents = {
	subscribe(handler) {
		if (typeof navigator === "undefined" || !navigator.mediaDevices) {
			return () => {}
		}

		const listener = () => handler()

		navigator.mediaDevices.addEventListener("devicechange", listener)

		return () => {
			navigator.mediaDevices.removeEventListener("devicechange", listener)
		}
	},
}

export default webAudioDevicesEvents
