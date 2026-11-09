import ElectronStore from "electron-store"

import isDev from "../../utils/isDev.js"

export const APP_CHANNELS = ["stable", "indev"] as const

export type AppChannel = (typeof APP_CHANNELS)[number]

const defaults = {
	"desktop:app_channel": "stable" satisfies AppChannel,
}

export function isAppChannel(value: unknown): value is AppChannel {
	return APP_CHANNELS.includes(value as AppChannel)
}

export default class Settings {
	readonly store: ElectronStore<Record<string, unknown>>

	constructor() {
		this.store = new ElectronStore<Record<string, unknown>>({
			name: isDev() ? "settings_dev" : "settings",
			defaults,
		})
	}

	get path(): string {
		return this.store.path
	}

	get(key: string): unknown {
		return this.store.get(key)
	}

	set(key: string, value: unknown): void {
		this.store.set(key, value)
	}

	delete(key: string): void {
		this.store.delete(key)
	}

	clear(): void {
		this.store.clear()
	}

	getChannel(): AppChannel {
		const channel = this.get("desktop:app_channel")

		return isAppChannel(channel) ? channel : "stable"
	}

	setChannel(channel: unknown): AppChannel {
		const value: AppChannel = isAppChannel(channel) ? channel : "stable"

		this.set("desktop:app_channel", value)

		return value
	}
}
