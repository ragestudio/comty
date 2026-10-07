import type { Self } from ".."
import BaseStream, { type BaseHandlerParams } from "./base"

export interface MicStreamParams extends BaseHandlerParams {
	start: { force?: boolean; deviceId?: string }
	close: { force?: boolean; reason?: string }
}

export const MicStream = (self: Self) =>
	new BaseStream<MicStreamParams>(self, "mic", {
		async onStart(params) {
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

			console.log(`[micStream] created stream:`, this.stream)

			// InCallManager.start({ media: "audio" })
			// InCallManager.setForceSpeakerphoneOn(true)

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
