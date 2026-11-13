import { readAudioSetting, writeAudioSetting } from "./settings"

export const SOUNDPAD_VOLUME_SETTING_KEY = "audio:soundpadVolume"
export const SOUNDPAD_DEFAULT_VOLUME = 0.5

function clampVolume(value: number) {
	return Math.min(1, Math.max(0, value))
}

export function getSoundpadVolume(): number {
	const value = readAudioSetting<number>(
		SOUNDPAD_VOLUME_SETTING_KEY,
		SOUNDPAD_DEFAULT_VOLUME,
	)

	if (typeof value !== "number" || !Number.isFinite(value)) {
		return SOUNDPAD_DEFAULT_VOLUME
	}

	return clampVolume(value)
}

export function setSoundpadVolume(volume: number) {
	if (typeof volume !== "number" || !Number.isFinite(volume)) {
		return
	}

	writeAudioSetting(SOUNDPAD_VOLUME_SETTING_KEY, clampVolume(volume))
}
