import { createRequire } from "module"
import { app, ipcMain, session, desktopCapturer } from "electron"

const sysaudio = createRequire(import.meta.url)(
	"../../../addons/sysaudio/sysaudio.node",
)

export default class SysAudio {
	constructor(main) {
		this.main = main

		sysaudio.initialize({
			excluded_pid: process.pid,
			node_name: this.main.constructor.isDev
				? "comty-sysaudio-dev"
				: "comty-sysaudio",
			device_app_id: "comty.desktop",
			device_app_name: this.main.constructor.isDev ? "ComtyDev" : "Comty",
			device_app_icon_name: "comty",
		})

		ipcMain.handle("sysaudio:startCapture", this.startCapture)
		ipcMain.handle("sysaudio:stopCapture", this.stopCapture)
		ipcMain.on("sysaudio:output", this.sendToOutput)
		ipcMain.handle(
			"sysaudio:output_supported",
			() => sysaudio.output_supported,
		)

		app.whenReady().then(() => {
			// set the default session handler
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

					const obj = {
						video: sources[0],
					}

					callback(obj)
				},
				{ useSystemPicker: true },
			)
		})
	}

	sendToOutput = (_, buffer, format) => {
		sysaudio.output(buffer, format)
	}

	audioBufferCallback = (buffer, format) => {
		this.main.mainWindow.webContents.send("sysaudio:input", {
			buffer: buffer,
			...format,
		})
	}

	startCapture = () => {
		if (this.main.mainWindow.isDestroyed()) {
			return false
		}

		sysaudio.start_capture(process.pid, this.audioBufferCallback)

		return true
	}

	stopCapture = () => {
		sysaudio.stop_capture()
	}
}
