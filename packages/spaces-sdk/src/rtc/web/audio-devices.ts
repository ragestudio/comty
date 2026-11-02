import type { AudioDevicesEvents } from "@/adapter"

import { AUDIO_SETTINGS_KEYS, readAudioSetting } from "@/rtc/audio/settings"

// the input device chosen by the user, shared between routing and capture so
// getUserMedia starts on the right device
let selectedInputDeviceId: string | null = null
let loaded = false

// device ids are only visible once the microphone permission is granted, so the
// stored selection cannot be applied at startup. reading it lazily makes the
// first capture (and the device list) use the saved device anyway
export function getSelectedInputDeviceId(): string | null {
	if (!loaded) {
		loaded = true

		const stored = readAudioSetting<string | null>(
			AUDIO_SETTINGS_KEYS.inputDeviceId,
			null,
		)

		selectedInputDeviceId = stored && stored !== "" ? stored : null
	}

	return selectedInputDeviceId
}

export function setSelectedInputDeviceId(deviceId: string | null) {
	loaded = true
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
