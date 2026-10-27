import adapter from "@/adapter"

export const AUDIO_SETTINGS_KEYS = {
	noiseSuppression: "audio:noiseSuppression",
	echoCancellation: "audio:echoCancellation",
	gainMode: "audio:gainMode",
	gateEnabled: "audio:gateEnabled",
	gateThresholdDb: "audio:gateThresholdDb",
	inputGainDb: "audio:inputGainDb",
	outputGainDb: "audio:outputGainDb",
	inputDeviceId: "audio:inputDeviceId",
	outputDeviceId: "audio:outputDeviceId",
} as const

export function readAudioSetting<T>(key: string, fallback: T): T {
	const value = adapter.audioSettings?.get<T>(key)

	if (value === undefined || value === null) {
		return fallback
	}

	return value
}

export function writeAudioSetting(key: string, value: unknown) {
	adapter.audioSettings?.set(key, value)
}
