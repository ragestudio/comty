import type { AudioRouting } from "@/adapter"
import type { AudioDevice } from "@/rtc/audio"

import { AUDIO_SETTINGS_KEYS, readAudioSetting } from "@/rtc/audio/settings"

import { setAudioSink } from "./audio-context"
import {
	getSelectedInputDeviceId,
	setSelectedInputDeviceId,
} from "./audio-devices"
import { switchMicInput } from "./audio-processing"

let outputDeviceId: string | null = null
let outputLoaded = false

// same as the input device, the stored output is read lazily so it is used on
// the first session even though the device list is empty before permissions
function getSelectedOutputDeviceId(): string | null {
	if (!outputLoaded) {
		outputLoaded = true

		const stored = readAudioSetting<string | null>(
			AUDIO_SETTINGS_KEYS.outputDeviceId,
			null,
		)

		outputDeviceId = stored && stored !== "" ? stored : null
	}

	return outputDeviceId
}

async function enumerateDevices(): Promise<MediaDeviceInfo[]> {
	if (!navigator.mediaDevices?.enumerateDevices) return []

	return navigator.mediaDevices.enumerateDevices()
}

export const webAudioRouting: AudioRouting = {
	// browsers have no earpiece/speakerphone concept
	supportsSpeakerphone: false,

	async getAudioDevices(): Promise<AudioDevice[]> {
		const devices = await enumerateDevices()

		return devices
			.filter(
				(device) =>
					device.kind === "audioinput" ||
					device.kind === "audiooutput",
			)
			.map((device) => {
				const isInput = device.kind === "audioinput"
				const selected = isInput
					? getSelectedInputDeviceId()
					: getSelectedOutputDeviceId()

				return {
					id: device.deviceId,
					kind: isInput ? "input" : "output",
					type: isInput ? "input" : "output",
					label:
						device.label ||
						(isInput ? "Microphone" : "Audio output"),
					isCurrent:
						selected !== null
							? device.deviceId === selected
							: device.deviceId === "default",
				}
			})
	},

	setSpeakerphoneOn() {
		// no-op on web
	},

	async isSpeakerphoneOn() {
		return false
	},

	async setAudioOutputDevice(deviceId: string) {
		const applied = await setAudioSink(deviceId)

		if (applied) {
			outputDeviceId = deviceId
			outputLoaded = true
		}

		return applied
	},

	async setAudioInputDevice(deviceId: string) {
		// a live capture cannot change its device, so the adapter re-acquires it
		const applied = await switchMicInput(deviceId)

		if (!applied) return false

		setSelectedInputDeviceId(deviceId)

		return true
	},

	async isBluetoothAvailable() {
		return false
	},

	async resetAudioRouting() {
		setSelectedInputDeviceId(null)
		outputDeviceId = null
		outputLoaded = true

		await setAudioSink("")

		return true
	},
}

export default webAudioRouting
