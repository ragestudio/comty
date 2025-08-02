import pkgjson from "../package.json" with { type: "json" }
import { fileURLToPath } from "node:url"
import path from "node:path"
import os from "node:os"

import { app, ipcMain, Tray, Menu, BrowserWindow } from "electron"
import ElectronStore from "electron-store"

import flags from "./flags.js"
import IPC from "./ipc.js"
import TrayItems from "./tray.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const forceDist = process.argv.includes("--force-dist")
const forceIndev = process.argv.includes("--force-indev")

class Main {
	constructor() {
		process.title = pkgjson.processName

		app.commandLine.appendSwitch("application-name", pkgjson.processName)
		app.commandLine.appendSwitch(
			"pulseaudio-product-string",
			pkgjson.processNamee,
		)
		app.setName(pkgjson.processName)

		flags()
	}

	static productionUrl = "https://comty.app"
	static indevUrl = "https://indev.comty.app"
	static developmentUrl = "http://localhost:8000"

	static iconPath = path.join(__dirname, "../resources/icon-512.png")

	app = app

	mainWindow = null
	tray = null
	store = null

	modules = new Map()

	static get isElectronOnDev() {
		const getFromEnv =
			Number.parseInt(process.env["ELECTRON_IS_DEV"], 10) === 1

		return process.env["ELECTRON_IS_DEV"] ? getFromEnv : !app.isPackaged
	}

	async initialize() {
		// apply os specific patches
		await this.applyPatches().catch((error) => {
			console.error("Error applying patches", error)
		})

		// start desktop capturer
		const dc_module = await import("./classes/DesktopCapturer.js")
		this.modules.set("desktopCapturer", new dc_module.default(this))

		await this.modules.get("desktopCapturer").initialize()

		ElectronStore.initRenderer()

		await this.registerIpcEvents()

		await app.whenReady()

		await this.createTray()
		await this.createMainWindow()

		// Handle app cleanup on quit
		app.on("before-quit", async (event) => {
			event.preventDefault()
			await this.destroy()
			app.exit(0)
		})

		app.on("window-all-closed", async () => {
			if (process.platform !== "darwin") {
				await this.destroy()
				app.quit()
			}
		})
	}

	async applyPatches() {
		switch (os.platform()) {
			case "linux":
				let patches = await import("./patches/linux/index.js")

				patches = patches.default

				await patches(this)
				break
			default:
				throw new Error("Unsupported platform")
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

		if (Main.isElectronOnDev && !forceDist) {
			this.mainWindow.loadURL(Main.developmentUrl)
		} else {
			if (forceIndev) {
				this.mainWindow.loadURL(Main.indevUrl)
			} else {
				this.mainWindow.loadURL(Main.productionUrl)
			}
		}

		if (Main.isElectronOnDev) {
			this.mainWindow.webContents.openDevTools()
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
		// Clean up desktop capturer first
		const desktopCapturer = this.modules.get("desktopCapturer")

		if (desktopCapturer && typeof desktopCapturer.destroy === "function") {
			await desktopCapturer.destroy()
		}

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
			ipcMain.handle(key, this.buildIPCEventHandler(key, fn))
		}
	}
}

new Main().initialize()
