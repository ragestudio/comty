import {
	app,
	ipcMain,
	Tray,
	Menu,
	BrowserWindow,
	session,
	desktopCapturer,
} from "electron"
import ElectronStore from "electron-store"
import { fileURLToPath } from "node:url"
import path from "node:path"

import IPC from "./ipc.js"
import TrayItems from "./tray.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Main {
	static developmentUrl = "http://localhost:8000"
	static iconPath = path.resolve(__dirname, "../assets/icon-512.png")

	app = app

	mainWindow = null
	tray = null
	store = null

	static get isElectronOnDev() {
		const getFromEnv = Number.parseInt(process.env["ELECTRON_IS_DEV"], 10) === 1

		return process.env["ELECTRON_IS_DEV"] ? getFromEnv : !app.isPackaged
	}

	async initialize() {
		ElectronStore.initRenderer()

		await this.registerIpcEvents()

		await app.whenReady()

		await this.createTray()
		await this.createMainWindow()

		session.defaultSession.setDisplayMediaRequestHandler(
			(request, callback) => {
				desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
					// Grant access to the first screen found.
					callback({ video: sources[0], audio: "loopback" })
				})
				// If true, use the system picker if available.
				// Note: this is currently experimental. If the system picker
				// is available, it will be used and the media request handler
				// will not be invoked.
			},
			{ useSystemPicker: true },
		)
	}

	async createMainWindow() {
		this.mainWindow = new BrowserWindow({
			titleBarStyle: "hidden",
			webPreferences: {
				preload: path.resolve(__dirname, "./preload.js"),
				nodeIntegration: true,
			},
		})

		if (Main.isElectronOnDev) {
			this.mainWindow.loadURL(Main.developmentUrl)
			this.mainWindow.webContents.openDevTools()
		} else {
			this.mainWindow.loadFile("./index.html")
		}

		return this.mainWindow
	}

	async createTray() {
		const items = TrayItems.map((item) => {
			if (typeof item.onClick === "function") {
				item.click = () => {
					item.onClick(this)
				}
			}

			return item
		})

		const menu = Menu.buildFromTemplate(items)

		this.tray = new Tray(Main.iconPath)
		this.tray.setContextMenu(menu)
		this.tray.on("double-click", () => {
			this.mainWindow.show()
		})
	}

	async destroy() {
		if (this.tray) {
			this.tray.destroy()
		}

		if (this.mainWindow) {
			this.mainWindow.destroy()
		}
	}

	buildIPCEventHandler(event, fn) {
		return async (...args) => {
			try {
				const result = await fn(this, ...args)
				return result
			} catch (error) {
				console.error(`IPC event "${event}" error`, error)
			}
		}
	}

	async registerIpcEvents() {
		for (const [key, fn] of Object.entries(IPC)) {
			ipcMain.on(key, this.buildIPCEventHandler(key, fn))
		}
	}
}

new Main().initialize()
