import os from "node:os"

import DesktopCapturerLinux from "./linux.js"

export default class DesktopCapturer {
	constructor(main) {
		switch (os.platform()) {
			case "linux":
				return new DesktopCapturerLinux(main)
			default:
				console.error(
					"DesktopCapturer module is not supported on this platform",
				)
				break
		}
	}
}
