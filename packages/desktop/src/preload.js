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
		ipcRenderer.invoke("app:restart")
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
})
