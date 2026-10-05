import type { Self } from ".."

import BaseStream from "./base"

export const ScreenStream = (self: Self) =>
	new BaseStream(self, "screen", {
		async onStart(params) {
			return null
		},
		async onClose() {
			if (this.stream) {
				this.stream.release(true)
			}
		},
	})

export default ScreenStream
