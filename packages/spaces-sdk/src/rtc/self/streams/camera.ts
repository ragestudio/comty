import type { Self } from ".."
import BaseStream, { type BaseHandlerParams } from "./base"

export interface CameraStreamParams extends BaseHandlerParams {
	start: {
		force?: boolean
		deviceId?: string
		facingMode?: "user" | "environment"
		resolution?: { width?: number; height?: number }
	}
	close: { force?: boolean; reason?: string }
}

export const CameraStream = (self: Self) =>
	new BaseStream<CameraStreamParams>(self, "cam", {
		async onStart(params) {
			this.stream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: {
					facingMode: params?.facingMode ?? "user",
					...(params?.deviceId
						? { deviceId: params.deviceId }
						: undefined),
					...(params?.resolution?.width
						? { width: { ideal: params.resolution.width } }
						: undefined),
					...(params?.resolution?.height
						? { height: { ideal: params.resolution.height } }
						: undefined),
				},
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
