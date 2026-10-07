import type { Self } from ".."

import BaseStream from "./base"

export const ScreenStream = (self: Self) =>
	new BaseStream(self, "screen", {
		async onStart(params) {
			return null
		},
		async onClose() {
			if (this.stream) {
				for (const track of this.stream.getTracks()) {
					if (!track.stop) continue
					track.stop()
				}

				if (typeof this.stream.release === "function") {
					this.stream.release(true)
				}
			}
		},
	})

export default ScreenStream
