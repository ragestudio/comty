import type { Self } from ".."
import BaseStream, { type BaseHandlerParams } from "./base"

export interface CameraStreamParams extends BaseHandlerParams {
	start: { force?: boolean; deviceId?: string }
	close: { force?: boolean; reason?: string }
}

export const CameraStream = (self: Self) =>
	new BaseStream<CameraStreamParams>(self, "mic", {
		async onStart() {
			this.stream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: true,
			})

			console.log(`[cameraStream] created stream:`, this.stream)

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

export default CameraStream
