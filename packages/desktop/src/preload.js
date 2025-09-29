import { contextBridge, ipcRenderer } from "electron"

import Settings from "./classes/Settings/index.js"

const settings = new Settings()

contextBridge.exposeInMainWorld("__ELECTRON__", {
	desktop: true,
	settings: {
		path: settings.path,
		get: (key) => settings.get(key),
		set: (...args) => settings.set(...args),
		delete: (...args) => settings.delete(...args),
		clear: () => settings.clear(),
	},
	restart: () => {
		return ipcRenderer.invoke("app:restart")
	},
	extensions: () => {
		return ipcRenderer.invoke("extensions:list")
	},
})

contextBridge.exposeInMainWorld("ipcRenderer", {
	invoke: async (channel, data) => {
		return await ipcRenderer.invoke(channel, data)
	},
	send: (channel, data) => {
		ipcRenderer.send(channel, data)
	},
	on: (channel, fn) => {
		ipcRenderer.on(channel, fn)
	},
	handle: (channel, fn) => {
		ipcRenderer.on(channel, async (...args) => {
			try {
				const data = await fn(...args)

				ipcRenderer.send(`${channel}:reply`, {
					data: data,
					error: null,
				})
			} catch (error) {
				ipcRenderer.send(`${channel}:reply`, {
					error: error.message,
				})
			}
		})
	},
})
