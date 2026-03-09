import { createRequire } from "module"
import { session, desktopCapturer, app } from "electron"

const wincapture = createRequire(import.meta.url)(
	"../../addons/wincapture/build/Release/wincapture.node",
)

export default class DesktopCapturerWindows {
	constructor(main) {
		this.main = main

		console.log(
			"[desktopcapturer] Starting DesktopCapturer module [windows]",
		)

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

		app.on("will-quit", () => {
			wincapture.stop()
		})
	}

	startSystemAudioCapture = async () => {
		if (!this.main.mainWindow.isDestroyed()) {
			console.log("Starting winaudio capture thread", {
				excludePid: process.pid,
			})

			wincapture.start(process.pid, (pcm) => {
				try {
					this.main.mainWindow.webContents.send(
						"desktopcapturer:sysaudio-buff",
						pcm,
					)
				} catch (err) {
					console.error(err)
				}
			})
		}
	}

	stopSystemAudioCapture = async () => {
		wincapture.stop()
	}
}
