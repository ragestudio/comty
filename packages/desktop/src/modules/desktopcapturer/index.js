import os from "node:os"

import DesktopCapturerLinux from "./linux.js"
import DesktopCapturerWindows from "./windows.js"

export default class DesktopCapturer {
	constructor(main) {
		switch (os.platform()) {
			case "linux":
				return new DesktopCapturerLinux(main)
			case "win32":
				return new DesktopCapturerWindows(main)
			default:
				console.error(
					"DesktopCapturer module is not supported on this platform",
				)
				break
		}
	}
}
