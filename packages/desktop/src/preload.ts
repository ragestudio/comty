import { contextBridge, ipcRenderer } from "electron"

import Settings, { type AppChannel } from "./classes/Settings/index.js"
import SysAudioBridge from "./sysaudio/index.js"

const settings = new Settings()

// electron only: system audio capture runs in the renderer process so the
// native addon and the audio worklets share a SharedArrayBuffer directly
new SysAudioBridge().register()

contextBridge.exposeInMainWorld("__ELECTRON__", {
	desktop: true,
	settings: {
		path: settings.path,
		get: (key: string) => settings.get(key),
		set: (key: string, value: unknown) => settings.set(key, value),
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
