import type { AudioStrategy } from "../types"

import adapter from "@/adapter"

const nativeStrategy: AudioStrategy = {
	name: "native-audio-routing",
	speakerAvailable: true,
	supports() {
		return !!adapter.audioRouting
	},
	async getDevices() {
		return (await adapter.audioRouting?.getAudioDevices()) ?? []
	},
	async setSpeakerEnabled(enabled) {
		adapter.audioRouting?.setSpeakerphoneOn(enabled)
	},
	async isSpeakerEnabled() {
		return (await adapter.audioRouting?.isSpeakerphoneOn()) ?? false
	},
	async setOutputDevice(deviceId) {
		return (
			(await adapter.audioRouting?.setAudioOutputDevice(deviceId)) ??
			false
		)
	},
	async setInputDevice(deviceId) {
		return (
			(await adapter.audioRouting?.setAudioInputDevice?.(deviceId)) ??
			false
		)
	},
	async setRouteMode(mode) {
		return (await adapter.audioRouting?.setAudioRouteMode?.(mode)) ?? false
	},
	async isBluetoothAvailable() {
		return (await adapter.audioRouting?.isBluetoothAvailable?.()) ?? false
	},
}

export default nativeStrategy
