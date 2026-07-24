import { BrowserWindow } from "electron"

import getCPUInfo from "./ipc_handlers/getCpuInfo.js"
import getGpuEncodeCaps from "./ipc_handlers/getGpuEncodeCaps.js"

export default {
	"cpu:info": getCPUInfo,
	"gpu:encode-caps": getGpuEncodeCaps,
	"window:minimize": (ctx) => {
		ctx.mainWindow.minimize()
	},
	"window:maximize": (ctx) => {
		ctx.mainWindow.maximize()
	},
	"window:close": (ctx) => {
		ctx.mainWindow.hide()
	},
	"app:restart": (ctx) => {
		ctx.restart()
	},
	"extensions:load": async (ctx, event, ...args) => {
		//return await ctx.extensions.load(...args)
	},
	"extensions:list": (ctx, event, ...args) => {
		return ctx.extensions
	},
	"extensions:install": async (ctx, event, ...args) => {
		return await ctx.extensions.install(...args)
	},
	"debug:open-chrome-page": async (ctx, event, page) => {
		const win = new BrowserWindow({
			width: 1200,
			height: 800,
			title: page,
			webPreferences: {
				nodeIntegration: false,
				sandbox: false,
				webSecurity: false,
			},
		})

		await win.loadURL(`chrome://${page}`)

		win.on("closed", () => win.destroy())

		return true
	},
}
