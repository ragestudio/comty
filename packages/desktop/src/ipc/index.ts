import { BrowserWindow, type IpcMainInvokeEvent } from "electron"

import type Main from "../main.js"

import getCpuInfo from "./handlers/cpuInfo.js"
import getGpuEncodeCaps from "./handlers/gpuEncodeCaps.js"

export type IpcHandler<Arguments extends any[] = any[], Result = any> = (
	main: Main,
	event: IpcMainInvokeEvent,
	...args: Arguments
) => Result | Promise<Result>

export type IpcHandlers = Record<string, IpcHandler>

const handlers: IpcHandlers = {
	"app:info": (main) => ({
		pid: process.pid,
		isDev: main.isDev,
	}),
	"app:channel:get": (main) => main.settings.getChannel(),
	"app:channel:set": (main, event, channel: unknown) =>
		main.settings.setChannel(channel),
	"cpu:info": () => getCpuInfo(),
	"gpu:encode-caps": () => getGpuEncodeCaps(),
	"window:minimize": (main) => {
		main.mainWindow?.minimize()
	},
	"window:maximize": (main) => {
		main.mainWindow?.maximize()
	},
	"window:close": (main) => {
		main.mainWindow?.hide()
	},
	"app:restart": (main) => {
		main.restart()
	},
	"extensions:load": async () => {
		//return await main.extensions.load(...args)
	},
	"extensions:list": (main) => {
		return main.extensions
	},
	"extensions:install": async (main, event, ...args) => {
		return await main.extensions.install(args[0])
	},
	"debug:open-chrome-page": async (main, event, page: string) => {
		const window = new BrowserWindow({
			width: 1200,
			height: 800,
			title: page,
			webPreferences: {
				nodeIntegration: false,
				sandbox: false,
				webSecurity: false,
			},
		})

		await window.loadURL(`chrome://${page}`)

		window.on("closed", () => window.destroy())

		return true
	},
}

export default handlers
