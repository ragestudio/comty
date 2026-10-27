import type { Self } from ".."
import type { ScreenContentHint } from "@/rtc/self/constants"
import type { BaseHandlerParams } from "./base"

import BaseStream from "./base"
import adapter from "@/adapter"
import { logger } from "@/rtc/self"

// tracks the streams that captured audio through the host system audio adapter,
// so onClose knows whether it has to stop the platform capture
const systemAudioStreams = new WeakSet<object>()

export interface ScreenStreamParams extends BaseHandlerParams {
	start: {
		force?: boolean
		resolution?: { width?: number; height?: number }
		framerate?: number
		systemAudio?: boolean
		contentHint?: ScreenContentHint
	}
	close: { force?: boolean; reason?: string }
}

export const ScreenStream = (self: Self) =>
	new BaseStream<ScreenStreamParams>(self, "screen", {
		async onStart(params) {
			const systemAudio = params?.systemAudio
				? adapter.systemAudio
				: undefined

			const useSystemAudio =
				!!systemAudio && (await systemAudio.isSupported())

			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { max: params?.resolution?.width ?? 1920 },
					height: { max: params?.resolution?.height ?? 1080 },
					frameRate: { max: params?.framerate ?? 30 },
				},
				// when the platform exposes a dedicated loopback capture, request
				// video only and add the system audio track below
				audio: useSystemAudio ? false : !!params?.systemAudio,
			})

			if (useSystemAudio) {
				try {
					const track = await systemAudio!.start()

					if (track) stream.addTrack(track)

					systemAudioStreams.add(this)
				} catch (error) {
					logger.error("failed to capture system audio", error)
				}
			}

			this.stream = stream

			const [videoTrack] = stream.getVideoTracks()

			// hint the encoder about the kind of content being shared
			if (videoTrack && params?.contentHint) {
				videoTrack.contentHint = params.contentHint
			}

			logger.log(`created stream:`, this.stream)

			return this.stream
		},

		async onClose() {
			if (systemAudioStreams.delete(this)) {
				await adapter.systemAudio?.stop().catch((error) => {
					logger.error("failed to stop system audio", error)
				})
			}

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
