import type { Self } from ".."
import type { BaseHandlerParams } from "./base"

import BaseStream from "./base"
import adapter from "@/adapter"
import { audioManager } from "@/rtc/audio"
import { logger } from "@/rtc/self"

export interface MicStreamParams extends BaseHandlerParams {
	start: { force?: boolean; deviceId?: string }
	close: { force?: boolean; reason?: string }
}

function captureMic(constraints: MediaTrackConstraints) {
	return navigator.mediaDevices.getUserMedia({
		video: false,
		audio: {
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true,
			...constraints,
		},
	})
}

export const MicStream = (self: Self) =>
	new BaseStream<MicStreamParams>(self, "mic", {
		async onStart() {
			const constraints =
				adapter.audioProcessing?.getMicrophoneConstraints?.() ?? {}

			let captured: MediaStream

			try {
				captured = await captureMic(constraints)
			} catch (error) {
				if (!constraints.deviceId) throw error

				// the selected device may be gone, fall back to the system default
				const { deviceId, ...fallback } = constraints

				logger.warn(
					"selected microphone is not available, using the default",
					error,
				)

				captured = await captureMic(fallback)
			}

			// the device list exposes real ids only after the permission is granted,
			// so refresh it to resolve the selected devices
			audioManager.refresh().catch(logger.error)

			// let the host post-process the captured stream (gain, gate, rnnoise)
			this.stream = adapter.mediaStreamProcessor
				? await adapter.mediaStreamProcessor(captured, "mic")
				: captured

			// the stream is not registered in self.streams yet, so restore the
			// stored preference
			this.self.applyMutePreference(this.stream)

			logger.log(`created stream:`, this.stream)

			return this.stream
		},
		async onClose() {
			if (this.stream) {
				// release the processing chain and the raw capture behind it
				adapter.mediaStreamReleaser?.(this.stream)

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
