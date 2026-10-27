import type { AudioSettingsStorage } from "@/adapter"

const PREFIX = "spaces_audio_settings:"

// browser/electron implementation of the audio settings storage. the sdk owns
// the keys and the lifecycle, this only persists them
export const webAudioSettingsStorage: AudioSettingsStorage = {
	get<T = unknown>(key: string): T | undefined {
		if (typeof localStorage === "undefined") return undefined

		try {
			const raw = localStorage.getItem(PREFIX + key)

			return raw === null ? undefined : (JSON.parse(raw) as T)
		} catch {
			return undefined
		}
	},

	set(key: string, value: unknown) {
		if (typeof localStorage === "undefined") return

		try {
			if (value === undefined || value === null) {
				localStorage.removeItem(PREFIX + key)
				return
			}

			localStorage.setItem(PREFIX + key, JSON.stringify(value))
		} catch {
			// storage may be disabled or full
		}
	},
}

export default webAudioSettingsStorage
