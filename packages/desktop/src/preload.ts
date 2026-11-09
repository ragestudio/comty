import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { contextBridge, ipcRenderer } from "electron"

import Settings, {
	isAppChannel,
	type AppChannel,
} from "./classes/Settings/index.js"
import { addonVersion } from "./sysaudio/addon.js"
import SysAudioBridge from "./sysaudio/index.js"

const settings = new Settings()

// keep the channel in sync for older renderers that still write it inside
// the app_settings object instead of using the channel bridge
const storedAppSettings = settings.get("app_settings")

let lastAppChannel: unknown =
	storedAppSettings && typeof storedAppSettings === "object"
		? (storedAppSettings as Record<string, unknown>)["desktop:app_channel"]
		: undefined

function readAppBuildInfo(): { version: string; build: string } {
	const preloadPath = fileURLToPath(import.meta.url)
	const manifestPath = path.resolve(
		path.dirname(preloadPath),
		"../package.json",
	)

	try {
		const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
			version?: string
		}

		return {
			version: manifest.version ?? "unknown",
			build: new Date(fs.statSync(preloadPath).mtime).toISOString(),
		}
	} catch {
		return { version: "unknown", build: "unknown" }
	}
}

const appBuildInfo = readAppBuildInfo()

// electron only: system audio capture runs in the renderer process so the
// native addon and the audio worklets share a SharedArrayBuffer directly
new SysAudioBridge().register()

contextBridge.exposeInMainWorld("__ELECTRON__", {
	desktop: true,
	settings: {
		path: settings.path,
		get: (key: string) => settings.get(key),
		set: (key: string, value: unknown) => {
			settings.set(key, value)

			if (key !== "app_settings" || !value || typeof value !== "object") {
				return
			}

			const channel = (value as Record<string, unknown>)["desktop:app_channel"]

			if (channel === lastAppChannel) return

			lastAppChannel = channel

			if (isAppChannel(channel)) {
				void ipcRenderer.invoke("app:channel:set", channel)
			}
		},
		delete: (key: string) => settings.delete(key),
		clear: () => settings.clear(),
	},
	channel: {
		get: (): Promise<AppChannel> => {
			return ipcRenderer.invoke("app:channel:get")
		},
		set: (channel: AppChannel): Promise<AppChannel> => {
			return ipcRenderer.invoke("app:channel:set", channel)
		},
	},
	restart: () => {
		return ipcRenderer.invoke("app:restart")
	},
	extensions: () => {
		return ipcRenderer.invoke("extensions:list")
	},
	versions: {
		app: appBuildInfo.version,
		build: appBuildInfo.build,
		electron: process.versions.electron ?? "unknown",
		sysaudio: addonVersion,
	},
})

contextBridge.exposeInMainWorld("ipcRenderer", {
	invoke: async (channel: string, ...data: unknown[]) => {
		return await ipcRenderer.invoke(channel, ...data)
	},
	send: (channel: string, ...data: unknown[]) => {
		ipcRenderer.send(channel, ...data)
	},
	on: (channel: string, listener: (...args: any[]) => void) => {
		ipcRenderer.on(channel, listener)
	},
	handle: (channel: string, handler: (...args: any[]) => unknown) => {
		ipcRenderer.on(channel, async (...args) => {
			try {
				const data = await handler(...args)

				ipcRenderer.send(`${channel}:reply`, {
					data,
					error: null,
				})
			} catch (error) {
				ipcRenderer.send(`${channel}:reply`, {
					error: error instanceof Error ? error.message : String(error),
				})
			}
		})
	},
})
