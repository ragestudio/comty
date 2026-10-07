import type { Self } from ".."

import BaseStream, { type BaseHandlerParams } from "./base"

export interface ScreenStreamParams extends BaseHandlerParams {
	start: {
		resolution?: { width?: number; height?: number }
		framerate?: number
		force?: boolean
	}
	close: { force?: boolean; reason?: string }
}

export const ScreenStream = (self: Self) =>
	new BaseStream<ScreenStreamParams>(self, "screen", {
		async onStart(params) {
			this.stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { max: params?.resolution?.width ?? 1920 },
					height: { max: params?.resolution?.height ?? 1080 },
					frameRate: { max: params?.framerate ?? 30 },
				},
				//@ts-ignore
				systemAudio: "include",
			})

			console.log(`[screenStream] created stream:`, this.stream)

			return this.stream
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
