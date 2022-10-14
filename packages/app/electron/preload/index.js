const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
    ipcRenderer,
    isDev: () => {
        return process.env.NODE_ENV === "development"
    }
})