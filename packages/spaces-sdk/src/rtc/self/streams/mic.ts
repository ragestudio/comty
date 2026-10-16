import type { Self } from ".."
import type { BaseHandlerParams } from "./base"

import BaseStream from "./base"
import { logger } from "@/rtc/self"

export interface MicStreamParams extends BaseHandlerParams {
	start: { force?: boolean; deviceId?: string }
	close: { force?: boolean; reason?: string }
}

export const MicStream = (self: Self) =>
	new BaseStream<MicStreamParams>(self, "mic", {
		async onStart() {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: false,
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			})

			// if is muted, disable audio tracks
			if (this.self.isMuted) {
				for (const track of this.stream.getAudioTracks()) {
					track.enabled = false
				}
			}

			logger.log(`created stream:`, this.stream)

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

export default MicStream
