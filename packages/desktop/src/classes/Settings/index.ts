import fs from "node:fs"

import ElectronStore from "electron-store"

export const APP_CHANNELS = ["stable", "indev"] as const

export type AppChannel = (typeof APP_CHANNELS)[number]

interface ChannelStore {
	channel: AppChannel
}

const channelDefaults: ChannelStore = {
	channel: "stable",
}

export function isAppChannel(value: unknown): value is AppChannel {
	return APP_CHANNELS.includes(value as AppChannel)
}

export default class Settings {
	readonly store: ElectronStore<Record<string, unknown>>
	private readonly channelStore: ElectronStore<ChannelStore>

	constructor() {
		// the dev and production user data dirs are already separated by main,
		// so the file names stay the same for both
		this.store = new ElectronStore<Record<string, unknown>>({
			name: "settings",
		})

		this.channelStore = new ElectronStore<ChannelStore>({
			name: "app-channel",
			defaults: channelDefaults,
		})

		this.migrateChannel()
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
		const channel = this.channelStore.get("channel")

		return isAppChannel(channel) ? channel : "stable"
	}

	setChannel(channel: unknown): AppChannel {
		const value: AppChannel = isAppChannel(channel) ? channel : "stable"

		this.channelStore.set("channel", value)

		return value
	}

	private migrateChannel(): void {
		// the dedicated store is the source of truth once it exists, legacy
		// values are only used to seed it the first time it is created
		if (fs.existsSync(this.channelStore.path)) {
			return
		}

		const legacy = this.store.get("desktop:app_channel")
		const appSettings = this.store.get("app_settings")
		const rendererLegacy =
			appSettings && typeof appSettings === "object"
				? (appSettings as Record<string, unknown>)[
						"desktop:app_channel"
					]
				: undefined

		const candidate = isAppChannel(legacy)
			? legacy
			: isAppChannel(rendererLegacy)
				? rendererLegacy
				: undefined

		// only seed the dedicated store while it still holds the default
		if (candidate && candidate !== "stable") {
			this.channelStore.set("channel", candidate)
		}

		this.store.delete("desktop:app_channel")
	}
}
