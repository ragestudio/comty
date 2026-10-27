import type { AudioRouting } from "@/adapter"
import type { AudioDevice } from "@/rtc/audio"

import { setAudioSink } from "./audio-context"
import {
	getSelectedInputDeviceId,
	setSelectedInputDeviceId,
} from "./audio-devices"
import { getActiveMicTrack } from "./audio-processing"

let outputDeviceId: string | null = null

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
					: outputDeviceId

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
		}

		return applied
	},

	async setAudioInputDevice(deviceId: string) {
		const track = getActiveMicTrack()

		// no active capture yet, the selection is applied when the mic starts
		if (!track) {
			setSelectedInputDeviceId(deviceId)
			return true
		}

		try {
			await track.applyConstraints({ deviceId: { exact: deviceId } })
			setSelectedInputDeviceId(deviceId)
			return true
		} catch (error) {
			console.error(
				"[spaces-adapter] failed to switch input device",
				error,
			)
			return false
		}
	},

	async isBluetoothAvailable() {
		return false
	},

	async resetAudioRouting() {
		setSelectedInputDeviceId(null)
		outputDeviceId = null

		await setAudioSink("")

		return true
	},
}

export default webAudioRouting
