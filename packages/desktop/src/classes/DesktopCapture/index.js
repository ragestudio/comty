import { createRequire } from "module"
import { app, ipcMain, session, desktopCapturer } from "electron"

const sysaudio = createRequire(import.meta.url)(
	"../../addons/sysaudio/build/Release/sysaudio.node",
)

export default class DesktopCapture {
	constructor(main) {
		this.main = main

		ipcMain.handle(
			"desktopcapturer:startSystemAudioCapture",
			this.startSystemAudioCapture,
		)
		ipcMain.handle(
			"desktopcapturer:stopSystemAudioCapture",
			this.stopSystemAudioCapture,
		)

		app.whenReady().then(() => {
			// set the default session handler
			session.defaultSession.setDisplayMediaRequestHandler(
				async (request, callback) => {
					const sources = await desktopCapturer.getSources({
						types: ["screen"],
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

	audioBufferCallback = (buffer, format) => {
		this.main.mainWindow.webContents.send(
			"desktopcapturer:sysaudio-buff",
			buffer,
		)
	}

	startSystemAudioCapture = () => {
		if (this.main.mainWindow.isDestroyed()) {
			return false
		}

		sysaudio.start(process.pid, this.audioBufferCallback)

		return true
	}

	stopSystemAudioCapture = () => {
		sysaudio.stop()
	}
}
