import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"

import {
	app,
	BrowserWindow,
	desktopCapturer,
	ipcMain,
	session,
	shell,
} from "electron"
import type { IpcMainInvokeEvent } from "electron"
import ElectronStore from "electron-store"

import { pkg } from "./config/app.js"
import applyFlags from "./config/flags.js"
import vars from "./config/vars.js"

import API from "./classes/Api/index.js"
import ExtensionManager from "./classes/Extensions/index.js"
import Settings from "./classes/Settings/index.js"

import ipcHandlers, { type IpcHandler } from "./ipc/index.js"
import { ModulesManager } from "./classes/Modules/index.js"
import { TrayManager } from "./classes/Tray/index.js"

export const currentDir = path.dirname(fileURLToPath(import.meta.url))

const LOAD_MODULES: string[] = []

export class Main {
	static get isDev(): boolean {
		const fromEnv = Number.parseInt(process.env["ELECTRON_IS_DEV"] ?? "", 10)

		return process.env["ELECTRON_IS_DEV"] ? fromEnv === 1 : !app.isPackaged
	}

	get isDev(): boolean {
		return Main.isDev
	}

	readonly app = app
	readonly state = {
		ready: false,
		restarting: false,
	}

	readonly api: API
	readonly settings: Settings

	tray = new TrayManager(this)
	modules = new ModulesManager(this)
	extensions = new ExtensionManager(this)
	mainWindow: BrowserWindow | null = null

	constructor() {
		process.title = pkg.processName

		this.app.commandLine.appendSwitch("application-name", pkg.processName)

		if (Main.isDev) {
			this.app.setName(`${pkg.processName}_dev`)
			this.app.setPath("userData", `${this.app.getPath("userData")}_dev`)
		} else {
			this.app.setName(pkg.processName)
		}

		applyFlags(this.app)

		this.api = new API(this)
		this.settings = new Settings()
	}

	async initialize(): Promise<void> {
		this.state.ready = false

		// init renderer store
		ElectronStore.initRenderer()

		// initialize api daemon
		await this.api.initialize()

		// initialize app extensions
		await this.extensions.initialize()

		for (const modulePath of LOAD_MODULES) {
			await this.modules.loadModule(modulePath)
		}

		// register ipc
		for (const [channel, listener] of Object.entries(ipcHandlers)) {
			this.registerIpcHandler(channel, listener)
		}

		// await to the app being ready
		await this.app.whenReady()
		await this.createMainWindow()

		this.tray.create()

		this.state.ready = true

		session.defaultSession.setPermissionRequestHandler(
			(webContents, permission, callback) => {
				return callback(true)
			},
		)

		session.defaultSession.setDisplayMediaRequestHandler(
			async (request, callback) => {
				const sources = await desktopCapturer.getSources({
					types: ["screen", "window"],
				})

				callback({
					video: sources[0],
				})
			},
			{ useSystemPicker: true },
		)

		this.app.on("before-quit", async (event) => {
			event.preventDefault()

			await this.destroy().catch((error) => {
				console.error(error)
			})

			this.app.exit(0)
		})

		this.app.on("window-all-closed", () => {
			if (process.platform === "darwin") {
				return
			}

			if (this.state.restarting) {
				return
			}

			app.quit()
		})
	}

	async createMainWindow(): Promise<BrowserWindow> {
		const window = new BrowserWindow({
			title: pkg.appName,
			frame: true,
			transparent: false,
			autoHideMenuBar: true,
			width: 1280,
			height: 720,
			show: false,
			webPreferences: {
				preload: path.resolve(currentDir, "./preload.js"),
				nodeIntegration: true,
				backgroundThrottling: false,
			},
		})

		this.mainWindow = window

		const appChannel = this.settings.getChannel()

		if (Main.isDev) {
			window.webContents.openDevTools()
			window.loadURL(vars.developmentUrl).catch(logLoadError)
		} else {
			const url = appChannel === "indev" ? vars.indevUrl : vars.productionUrl

			window.loadURL(url).catch(logLoadError)
		}

		if (os.platform() === "win32") {
			window.maximize()
		}

		window.show()

		window.webContents.setWindowOpenHandler(({ url }) => {
			shell.openExternal(url)
			return { action: "deny" }
		})

		return window
	}

	async destroy(): Promise<void> {
		await this.modules.unloadAllModules()

		this.tray?.destroy()
		this.mainWindow?.destroy()
	}

	async restart(): Promise<void> {
		this.state.restarting = true

		app.relaunch()
		app.exit()

		this.state.restarting = false
	}

	registerIpcHandler(channel: string, listener: IpcHandler): void {
		ipcMain.handle(channel, (event, ...args) => {
			return this.runIpcHandler(channel, listener, event, ...args)
		})
	}

	unregisterIpcHandler(channel: string): void {
		ipcMain.removeHandler(channel)
	}

	private async runIpcHandler(
		channel: string,
		handler: IpcHandler,
		event: IpcMainInvokeEvent,
		...args: unknown[]
	): Promise<unknown> {
		try {
			return await handler(this, event, ...args)
		} catch (error) {
			console.error(`IPC event "${channel}" error`, error)
			return undefined
		}
	}
}

function logLoadError(error: unknown) {
	console.error("[app] failed to load window url:", error)
}

export default Main
