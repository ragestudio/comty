import pkgjson from "../package.json" with { type: "json" }
import { fileURLToPath } from "node:url"
import path from "node:path"
import os from "node:os"
import {
	installExtension,
	REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer"

import { app, ipcMain, Tray, Menu, BrowserWindow } from "electron"
import ElectronStore from "electron-store"

import flags from "./flags.js"
import IPC from "./ipc.js"
import TrayItems from "./tray.js"
import Settings from "./classes/Settings/index.js"
import Vars from "./vars.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Main {
	constructor() {
		this.app = app

		process.title = pkgjson.processName

		this.app.commandLine.appendSwitch(
			"application-name",
			pkgjson.processName,
		)
		this.app.commandLine.appendSwitch(
			"pulseaudio-product-string",
			pkgjson.processNamee,
		)
		this.app.setName(pkgjson.processName)

		flags(this.app)
	}

	static get vars() {
		return Vars
	}

	static get isDev() {
		const getFromEnv =
			Number.parseInt(process.env["ELECTRON_IS_DEV"], 10) === 1

		return process.env["ELECTRON_IS_DEV"] ? getFromEnv : !app.isPackaged
	}

	state = {
		ready: false,
		restarting: false,
	}

	mainWindow = null
	tray = null
	store = null

	modules = new Map()
	settings = new Settings()

	async initialize() {
		this.state.ready = false

		// initRenderer
		ElectronStore.initRenderer()

		// register ipc
		await this.registerIpcEvents()

		// apply os specific patches
		await this.applyPatches()

		// start desktop capturer
		this.loadModule("desktopCapturer", "./modules/desktopcapturer/index.js")

		// await to the app being ready
		await this.app.whenReady()
		this.state.ready = true

		// install react dev tools
		await installExtension(REACT_DEVELOPER_TOOLS)

		await this.createTray()
		await this.createMainWindow()

		// Handle app cleanup on quit
		this.app.on("before-quit", async (event) => {
			event.preventDefault()

			await this.destroy().catch((error) => {
				console.error(error)
			})

			this.app.exit(0)
		})

		this.app.on("window-all-closed", async () => {
			if (process.platform !== "darwin") {
				if (this.state.restarting) {
					return
				}

				app.quit()
			}
		})
	}

	async loadModule(id, _path) {
		let mod = await import(_path)

		mod = new mod.default(this)

		if (typeof mod.initialize === "function") {
			await mod.initialize()
		}

		this.modules.set(id, mod)
		console.log(`[app] Loaded module ${id}`)
	}

	async unloadModule(id) {
		const mod = this.modules.get(id)

		if (!mod) {
			console.error(`[app] Module ${id} is not loaded`)
			return null
		}

		if (typeof mod.destroy === "function") {
			await mod.destroy()
		}

		this.modules.delete(id)
		console.log(`[app] Unloaded module ${id}`)
	}

	async unloadAllModules() {
		for (const [key, mod] of this.modules) {
			await this.unloadModule(key)
		}
	}

	async applyPatches() {
		switch (os.platform()) {
			case "linux":
				let patches = await import("./patches/linux/index.js")

				patches = patches.default

				await patches(this)
				break
			default:
				return
		}
	}

	async createMainWindow() {
		this.mainWindow = new BrowserWindow({
			title: pkgjson.appName,
			titleBarStyle: "hidden",
			webPreferences: {
				preload: path.resolve(__dirname, "./preload.js"),
				nodeIntegration: true,
			},
		})

		const app_channel = await this.settings.get("desktop:app_channel")

		if (Main.isDev) {
			this.mainWindow.webContents.openDevTools()
		}

		if (Main.isDev) {
			this.mainWindow.loadURL(Main.vars.developmentUrl)
		} else {
			switch (app_channel) {
				case "indev":
					this.mainWindow.loadURL(Main.vars.indevUrl)
					break
				default:
					this.mainWindow.loadURL(Main.vars.productionUrl)
					break
			}
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

		this.tray = new Tray(Main.vars.iconPath)
		this.tray.setContextMenu(menu)
		this.tray.on("double-click", () => {
			this.mainWindow.show()
		})
	}

	async destroy() {
		await this.unloadAllModules()

		if (this.tray) {
			this.tray.destroy()
		}

		if (this.mainWindow) {
			this.mainWindow.destroy()
		}
	}

	async restart() {
		this.state.restarting = true

		app.relaunch()
		app.exit()

		this.state.restarting = false
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
			ipcMain.handle(key, this.buildIPCEventHandler(key, fn))
		}
	}
}

new Main().initialize()
