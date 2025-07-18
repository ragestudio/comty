import { contextBridge, ipcRenderer } from "electron"
import ElectronStore from "electron-store"

const store = new ElectronStore()

contextBridge.exposeInMainWorld("__ELECTRON__", {
	desktop: true,
	store: {
		path: store.path,
		get: (key) => store.get(key),
		set: (...args) => store.set(...args),
		delete: (...args) => store.delete(...args),
		clear: () => store.clear(),
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
